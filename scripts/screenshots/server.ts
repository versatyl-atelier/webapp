import { createReadStream, existsSync, statSync } from "node:fs";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { extname, relative, resolve, sep } from "node:path";

import { ENVS, SCREENSHOTS_DIR, type EnvName } from "./config";
import { executeRun, prepareRun } from "./capture";
import { compareSides } from "./compare";
import { ScreenshotError, baseUrls } from "./envs";
import { renderCompare, renderHome, renderRunSheet } from "./html";
import { buildParams, lines } from "./params";
import { listRuns, readManifest, shotPath } from "./runs";

const HOST = "127.0.0.1";
const FILES_PREFIX = "/files/";
const RUNS_PATH = "/runs";
const RUNS_PREFIX = `${RUNS_PATH}/`;
const HOME_PATH = "/";
const COMPARE_PATH = "/compare";
const ERROR_PARAM = "error";
const MAX_BODY_BYTES = 100_000;
const CHECKED = "on";
const LIST_SEPARATOR = ",";
const URL_SEPARATOR = "/";
const HTML_TYPE = "text/html; charset=utf-8";
const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".html": HTML_TYPE,
  ".json": "application/json",
};
const STATUS = {
  ok: 200,
  seeOther: 303,
  forbidden: 403,
  notFound: 404,
  error: 500,
} as const;
const NAV = `<nav><a href="${HOME_PATH}">← Screenshots</a></nav>`;

type Reporter = (total: number) => Parameters<typeof executeRun>[1];

const filesRoot = resolve(SCREENSHOTS_DIR);

function fileUrl(file: string) {
  return `${FILES_PREFIX}${relative(filesRoot, file).split(sep).map(encodeURIComponent).join(URL_SEPARATOR)}`;
}

function send(
  response: ServerResponse,
  status: number,
  body: string,
  type = HTML_TYPE,
) {
  response.writeHead(status, { "content-type": type });
  response.end(body);
}

function redirect(response: ServerResponse, location: string) {
  response.writeHead(STATUS.seeOther, { location });
  response.end();
}

function homeWithError(response: ServerResponse, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  redirect(
    response,
    `${HOME_PATH}?${new URLSearchParams({ [ERROR_PARAM]: message })}`,
  );
}

async function readBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) {
      throw new ScreenshotError("Request too large");
    }
    chunks.push(buffer);
  }
  return new URLSearchParams(Buffer.concat(chunks).toString());
}

function serveFile(response: ServerResponse, pathname: string) {
  const file = resolve(
    filesRoot,
    decodeURIComponent(pathname.slice(FILES_PREFIX.length)),
  );
  if (
    !file.startsWith(`${filesRoot}${sep}`) ||
    !existsSync(file) ||
    !statSync(file).isFile()
  ) {
    send(response, STATUS.notFound, "Not found");
    return;
  }
  response.writeHead(STATUS.ok, {
    "content-type": CONTENT_TYPES[extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file).pipe(response);
}

export async function startServer(port: number, reporter: Reporter) {
  const origin = `http://${HOST}:${port}`;
  let activeRun: string | null = null;

  async function startRun(request: IncomingMessage, response: ServerResponse) {
    if (request.headers.origin !== origin) {
      send(response, STATUS.forbidden, "Forbidden");
      return;
    }
    if (activeRun) {
      throw new ScreenshotError(`Run ${activeRun} is still running`);
    }
    const form = await readBody(request);
    const params = await buildParams(
      {
        paths: [...form.getAll("page"), ...lines(form.get("paths") ?? "")],
        presets: form.getAll("preset"),
        widths: form.get("widths") ?? undefined,
        height: form.get("height") ?? undefined,
        modes: form.getAll("mode").join(LIST_SEPARATOR),
        envs: form.getAll("env").join(LIST_SEPARATOR),
        fullPage: form.get("fullPage") === CHECKED,
        scroll: lines(form.get("scroll") ?? ""),
        element: lines(form.get("element") ?? ""),
        sections: form.get("sections") === CHECKED,
        masks: lines(form.get("mask") ?? ""),
        waitFor: form.get("waitFor") ?? undefined,
        signedOut: form.get("signedOut") === CHECKED,
        as: form.get("as") ?? undefined,
        concurrency: form.get("concurrency") ?? undefined,
      },
      null,
    );
    const manifest = await prepareRun(form.get("name") || null, params);
    activeRun = manifest.id;
    executeRun(manifest, reporter(manifest.total))
      .catch((error) => console.error(error))
      .finally(() => {
        activeRun = null;
      });
    redirect(response, `${RUNS_PREFIX}${encodeURIComponent(manifest.id)}`);
  }

  async function handle(request: IncomingMessage, response: ServerResponse) {
    if (request.headers.host !== `${HOST}:${port}`) {
      send(response, STATUS.forbidden, "Forbidden");
      return;
    }
    const url = new URL(request.url ?? HOME_PATH, origin);
    const { pathname } = url;
    if (request.method === "POST" && pathname === RUNS_PATH) {
      await startRun(request, response);
      return;
    }
    if (request.method !== "GET") {
      send(response, STATUS.notFound, "Not found");
      return;
    }
    if (pathname === HOME_PATH) {
      send(
        response,
        STATUS.ok,
        renderHome(
          await listRuns(),
          baseUrls(Object.keys(ENVS) as EnvName[]),
          activeRun,
          url.searchParams.get(ERROR_PARAM),
        ),
      );
      return;
    }
    if (pathname.startsWith(RUNS_PREFIX)) {
      const manifest = readManifest(
        decodeURIComponent(pathname.slice(RUNS_PREFIX.length)),
      );
      send(
        response,
        STATUS.ok,
        renderRunSheet(
          manifest,
          (result) => fileUrl(shotPath(manifest.id, result.file)),
          NAV,
        ),
      );
      return;
    }
    if (pathname === COMPARE_PATH) {
      const { report } = await compareSides(
        url.searchParams.get("a") ?? "",
        url.searchParams.get("b") ?? "",
      );
      send(response, STATUS.ok, renderCompare(report, fileUrl, NAV));
      return;
    }
    if (pathname.startsWith(FILES_PREFIX)) {
      serveFile(response, pathname);
      return;
    }
    send(response, STATUS.notFound, "Not found");
  }

  const server = createServer((request, response) => {
    handle(request, response).catch((error) => {
      if (response.headersSent) {
        response.end();
        return;
      }
      if (error instanceof ScreenshotError) {
        homeWithError(response, error);
        return;
      }
      console.error(error);
      send(response, STATUS.error, "Error, see the terminal");
    });
  });
  await new Promise<void>((resolveListen) =>
    server.listen(port, HOST, resolveListen),
  );
  console.log(`Screenshot UI: ${origin}${HOME_PATH}`);
}
