import { PARAM_SEGMENT_PATTERN } from "@/constants/breadcrumbs";

export type Crumb = {
  href: string;
  label: string;
};

export type CrumbParams = Record<string, string>;

export type CrumbLabel = string | ((params: CrumbParams) => Promise<string>);

export type CrumbRoutes = Record<string, CrumbLabel>;

export type MatchedCrumbRoute = {
  href: string;
  label: CrumbLabel;
  params: CrumbParams;
};

function splitPath(path: string): string[] {
  return path.split("/").filter(Boolean);
}

function matchPattern(
  pattern: string[],
  segments: string[],
): CrumbParams | null {
  if (pattern.length !== segments.length) {
    return null;
  }
  const params: CrumbParams = {};
  for (const [index, patternSegment] of pattern.entries()) {
    const paramName = PARAM_SEGMENT_PATTERN.exec(patternSegment)?.[1];
    if (paramName) {
      params[paramName] = segments[index];
    } else if (patternSegment !== segments[index]) {
      return null;
    }
  }
  return params;
}

export function matchCrumbRoutes(
  routes: CrumbRoutes,
  segments: string[],
): MatchedCrumbRoute[] {
  const entries = Object.entries(routes).map(([pattern, label]) => ({
    pattern: splitPath(pattern),
    label,
  }));
  return segments.flatMap((_, index) => {
    const prefix = segments.slice(0, index + 1);
    for (const { pattern, label } of entries) {
      const params = matchPattern(pattern, prefix);
      if (params) {
        return [{ href: `/${prefix.join("/")}`, label, params }];
      }
    }
    return [];
  });
}

export async function resolveCrumbs(
  routes: CrumbRoutes,
  segments: string[],
): Promise<Crumb[]> {
  return Promise.all(
    matchCrumbRoutes(routes, segments).map(async ({ href, label, params }) => ({
      href,
      label: typeof label === "string" ? label : await label(params),
    })),
  );
}
