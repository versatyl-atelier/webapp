import { describe, expect, it } from "vitest";

import {
  clampFraming,
  coverFramingStyle,
  coverImageUrl,
  fitWithin,
  isCoverFile,
  nudgeFraming,
  panFraming,
  pastedFileName,
  fileThumbnailUrl,
  formatFileSize,
  sortSectionFiles,
  toSectionFile,
  type SectionFile,
} from "@/lib/projectFiles";

const entry = (name: string, tag: "file" | "folder" = "file") => ({
  ".tag": tag,
  id: `id:${name}`,
  name,
  path_display: `/P/${name}`,
  path_lower: `/p/${name.toLowerCase()}`,
  size: 1536,
  client_modified: "2026-10-01T12:00:00Z",
});

describe("toSectionFile", () => {
  it("flags images and thumbnailable files", () => {
    expect(toSectionFile(entry("a.JPG"))).toMatchObject({
      isImage: true,
      hasThumbnail: true,
      isFolder: false,
    });
    expect(toSectionFile(entry("plan.pdf"))).toMatchObject({
      isImage: false,
      hasThumbnail: true,
    });
    expect(toSectionFile(entry("cuisine.skp"))).toMatchObject({
      isImage: false,
      hasThumbnail: false,
    });
  });

  it("never treats a folder as an image", () => {
    expect(toSectionFile(entry("photo.jpg", "folder"))).toMatchObject({
      isFolder: true,
      isImage: false,
      hasThumbnail: false,
    });
  });
});

describe("sortSectionFiles", () => {
  const file = (name: string, isFolder = false): SectionFile => ({
    id: name,
    name,
    isFolder,
    size: null,
    modified: null,
    isImage: false,
    hasThumbnail: false,
  });

  it("puts folders first and sorts numbers naturally", () => {
    const sorted = sortSectionFiles([
      file("IMG 10.jpg"),
      file("PROD", true),
      file("IMG 2.jpg"),
      file("APPROBATION", true),
    ]);
    expect(sorted.map(({ name }) => name)).toEqual([
      "APPROBATION",
      "PROD",
      "IMG 2.jpg",
      "IMG 10.jpg",
    ]);
  });
});

describe("fileThumbnailUrl", () => {
  it("encodes the id and versions by modification date", () => {
    expect(
      fileThumbnailUrl(
        "p1",
        { id: "id:AB", modified: "2026-10-01T12:00:00Z" },
        "w480h320",
      ),
    ).toBe(
      "/projets/p1/fichiers?f=id%3AAB&s=w480h320&v=2026-10-01T12%3A00%3A00Z",
    );
  });

  it("omits the version when unknown", () => {
    expect(
      fileThumbnailUrl("p1", { id: "id:AB", modified: null }, "w480h320"),
    ).toBe("/projets/p1/fichiers?f=id%3AAB&s=w480h320");
  });
});

describe("formatFileSize", () => {
  it("scales units", () => {
    expect(formatFileSize(null)).toBe("");
    expect(formatFileSize(512)).toBe("512 o");
    expect(formatFileSize(1536)).toBe("1.5 Ko");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 Mo");
  });
});

describe("coverFramingStyle", () => {
  it("exposes the framing as css variables", () => {
    expect(coverFramingStyle({ x: 20, y: 80, zoom: 2.5 })).toEqual({
      "--cover-position": "20% 80%",
      "--cover-zoom": 2.5,
    });
  });
});

describe("clampFraming", () => {
  it("keeps the position within 0-100 and the zoom within 1-4", () => {
    expect(clampFraming({ x: -10, y: 140, zoom: 9 })).toEqual({
      x: 0,
      y: 100,
      zoom: 4,
    });
    expect(clampFraming({ x: 50, y: 50, zoom: 0.2 }).zoom).toBe(1);
  });
});

describe("panFraming", () => {
  const frame = { width: 400, height: 200 };

  it("moves opposite to the pointer, scaled by the zoom", () => {
    expect(
      panFraming({ x: 50, y: 50, zoom: 1 }, { x: 40, y: 0 }, frame),
    ).toEqual({
      x: 40,
      y: 50,
      zoom: 1,
    });
    expect(
      panFraming({ x: 50, y: 50, zoom: 2 }, { x: 40, y: 20 }, frame),
    ).toEqual({
      x: 45,
      y: 45,
      zoom: 2,
    });
  });

  it("never leaves the image", () => {
    expect(
      panFraming({ x: 5, y: 95, zoom: 1 }, { x: 400, y: -200 }, frame),
    ).toMatchObject({
      x: 0,
      y: 100,
    });
  });
});

describe("nudgeFraming", () => {
  it("steps and clamps", () => {
    expect(nudgeFraming({ x: 50, y: 50, zoom: 1 }, { x: 5, y: -5 })).toEqual({
      x: 55,
      y: 45,
      zoom: 1,
    });
    expect(
      nudgeFraming({ x: 98, y: 2, zoom: 1 }, { x: 5, y: -5 }),
    ).toMatchObject({
      x: 100,
      y: 0,
    });
  });
});

describe("isCoverFile", () => {
  it("accepts images only", () => {
    expect(isCoverFile({ type: "image/png" })).toBe(true);
    expect(isCoverFile({ type: "application/pdf" })).toBe(false);
    expect(isCoverFile({ type: "application/x-sketchup" })).toBe(false);
    expect(isCoverFile({ type: "" })).toBe(false);
  });
});

describe("pastedFileName", () => {
  const now = new Date("2026-11-05T09:30:15.000Z");

  it("keeps a real file name", () => {
    expect(
      pastedFileName({ name: "plan.png", type: "image/png" }, 0, now),
    ).toBe("plan.png");
  });

  it("names an anonymous clipboard image with the time and its type", () => {
    expect(
      pastedFileName({ name: "image.png", type: "image/png" }, 0, now),
    ).toBe("Image collée 2026-11-05-09-30-15-1.png");
    expect(pastedFileName({ name: "", type: "image/jpeg" }, 1, now)).toBe(
      "Image collée 2026-11-05-09-30-15-2.jpeg",
    );
  });

  it("falls back to png without a mime subtype", () => {
    expect(pastedFileName({ name: "", type: "" }, 0, now)).toMatch(/-1\.png$/);
  });
});

describe("fitWithin", () => {
  it("scales down the longest side and keeps the ratio", () => {
    expect(fitWithin({ width: 2560, height: 1440 }, 1280)).toEqual({
      width: 1280,
      height: 720,
    });
    expect(fitWithin({ width: 1000, height: 4000 }, 1280)).toEqual({
      width: 320,
      height: 1280,
    });
  });

  it("never upscales and never returns an empty side", () => {
    expect(fitWithin({ width: 800, height: 600 }, 1280)).toEqual({
      width: 800,
      height: 600,
    });
    expect(fitWithin({ width: 10000, height: 1 }, 1280)).toEqual({
      width: 1280,
      height: 1,
    });
  });
});

describe("coverImageUrl", () => {
  it("versions the url with the update time", () => {
    expect(coverImageUrl("p1", 7, new Date("2026-11-05T12:00:00.000Z"))).toBe(
      "/projets/p1/pieces/7/couverture?v=2026-11-05T12%3A00%3A00.000Z",
    );
  });
});
