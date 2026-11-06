import { describe, expect, it } from "vitest";

import {
  DROPBOX_UNNAMED_FOLDER,
  PIECE_SECTION_NAMES,
} from "@/constants/dropbox";
import {
  compareFileNames,
  uniqueFileName,
  fileExtension,
  hasThumbnail,
  isImageName,
  isWithinDropboxPath,
  parseSubpath,
  newPieceFolder,
  newProjectFolder,
  planFolderAdoption,
  dropboxSafeName,
  folderLabel,
  folderNumber,
  joinDropboxPath,
  nextFolderNumber,
  numberedFolder,
  pieceSectionFolders,
  renumberedFolder,
  uniqueFolderName,
} from "@/lib/dropbox";

describe("dropboxSafeName", () => {
  it("replaces forbidden characters", () => {
    expect(dropboxSafeName('Cuisine / îlot: "gauche"?')).toBe(
      "Cuisine - îlot- -gauche--",
    );
  });

  it("collapses spaces and strips trailing dots", () => {
    expect(dropboxSafeName("  Vanité   SDB. ")).toBe("Vanité SDB");
  });

  it("falls back when nothing is left", () => {
    expect(dropboxSafeName(" . ")).toBe(DROPBOX_UNNAMED_FOLDER);
    expect(dropboxSafeName("")).toBe(DROPBOX_UNNAMED_FOLDER);
  });
});

describe("joinDropboxPath", () => {
  it("joins segments with a single leading slash", () => {
    expect(joinDropboxPath("/Projets/", "Beauregard Lacasse", "PDM")).toBe(
      "/Projets/Beauregard Lacasse/PDM",
    );
  });

  it("returns an empty string for the root", () => {
    expect(joinDropboxPath("")).toBe("");
  });
});

describe("numbered folders", () => {
  it("builds and reads the number prefix", () => {
    expect(numberedFolder(2, "Vanité SDB des maitres")).toBe(
      "2. Vanité SDB des maitres",
    );
    expect(folderNumber("2. Vanité SDB des maitres")).toBe(2);
    expect(folderNumber("PDM")).toBeNull();
  });

  it("finds the next free number past the highest one", () => {
    expect(nextFolderNumber([])).toBe(1);
    expect(nextFolderNumber(["PDM", "Finition"])).toBe(1);
    expect(nextFolderNumber(["1. Cuisine", "3. Walk-in", "PDM"])).toBe(4);
  });

  it("keeps the number when the name changes", () => {
    expect(renumberedFolder("3. Walk-in", "Garde-robe")).toBe("3. Garde-robe");
    expect(renumberedFolder("PDM", "Prise de mesure")).toBe("Prise de mesure");
  });
});

describe("uniqueFolderName", () => {
  it("keeps the name when free", () => {
    expect(uniqueFolderName("Photos", ["3D"])).toBe("Photos");
  });

  it("adds a suffix ignoring case", () => {
    expect(uniqueFolderName("Photos", ["photos", "Photos (2)"])).toBe(
      "Photos (3)",
    );
  });
});

describe("pieceSectionFolders", () => {
  it("numbers the fixed sections in order", () => {
    const folders = pieceSectionFolders();
    expect(folders).toHaveLength(PIECE_SECTION_NAMES.length);
    expect(folders[6]).toEqual({
      name: "Dessins production",
      folder: "7. Dessins production",
    });
    expect(folders[7]?.folder).toBe("8. Listes de débit");
  });
});

describe("folderLabel", () => {
  it("strips the number prefix", () => {
    expect(folderLabel("2. Vanité SDB")).toBe("Vanité SDB");
    expect(folderLabel("PDM")).toBe("PDM");
  });
});

describe("isWithinDropboxPath", () => {
  it("accepts descendants, ignoring case", () => {
    expect(
      isWithinDropboxPath(
        "/projets/beauregard/pdm/a.jpg",
        "/Projets/Beauregard",
      ),
    ).toBe(true);
  });

  it("rejects the folder itself, siblings sharing a prefix and other roots", () => {
    expect(
      isWithinDropboxPath("/Projets/Beauregard", "/Projets/Beauregard"),
    ).toBe(false);
    expect(
      isWithinDropboxPath("/Projets/Beauregard 2/a.jpg", "/Projets/Beauregard"),
    ).toBe(false);
    expect(isWithinDropboxPath("/Autre/a.jpg", "/Projets/Beauregard")).toBe(
      false,
    );
  });

  it("never matches an empty parent", () => {
    expect(isWithinDropboxPath("/a.jpg", "")).toBe(false);
  });
});

describe("parseSubpath", () => {
  it("splits a relative path and tolerates empties", () => {
    expect(parseSubpath("PROD//V1")).toEqual(["PROD", "V1"]);
    expect(parseSubpath("")).toEqual([]);
    expect(parseSubpath(null)).toEqual([]);
  });

  it("rejects traversal and backslashes", () => {
    expect(parseSubpath("../x")).toBeNull();
    expect(parseSubpath("a/./b")).toBeNull();
    expect(parseSubpath("a\\b")).toBeNull();
  });
});

describe("file names", () => {
  it("reads the lowercase extension", () => {
    expect(fileExtension("Plan.PDF")).toBe("pdf");
    expect(fileExtension("sans-extension")).toBe("");
    expect(fileExtension("archive.tar.gz")).toBe("gz");
  });

  it("tells images and thumbnailable files apart", () => {
    expect(isImageName("IMG_7814.jpeg")).toBe(true);
    expect(isImageName("plan.pdf")).toBe(false);
    expect(hasThumbnail("plan.pdf")).toBe(true);
    expect(hasThumbnail("cuisine.skp")).toBe(false);
  });

  it("sorts numbers naturally", () => {
    expect(["IMG 10", "IMG 2", "IMG 1"].sort(compareFileNames)).toEqual([
      "IMG 1",
      "IMG 2",
      "IMG 10",
    ]);
  });
});

describe("uniqueFileName", () => {
  it("keeps a free name", () => {
    expect(uniqueFileName("Plan.pdf", ["Autre.pdf"])).toBe("Plan.pdf");
  });

  it("numbers before the extension, ignoring case", () => {
    expect(uniqueFileName("Plan.pdf", ["plan.pdf", "Plan (2).pdf"])).toBe(
      "Plan (3).pdf",
    );
  });

  it("handles names without extension and dotfiles", () => {
    expect(uniqueFileName("LISEZMOI", ["LISEZMOI"])).toBe("LISEZMOI (2)");
    expect(uniqueFileName(".gitignore", [".gitignore"])).toBe(".gitignore (2)");
  });

  it("replaces forbidden characters first", () => {
    expect(uniqueFileName("a/b:c.jpg", [])).toBe("a-b-c.jpg");
  });
});

describe("newProjectFolder", () => {
  it("never reuses an existing folder, whatever its case", () => {
    expect(newProjectFolder("Beauregard Lacasse", ["beauregard lacasse"])).toBe(
      "Beauregard Lacasse (2)",
    );
    expect(newProjectFolder("Tremblay Sophie", ["Autre"])).toBe(
      "Tremblay Sophie",
    );
  });
});

describe("newPieceFolder", () => {
  const existing = ["PDM", "Finition", "2. Vanité SDB des maitres"];

  it("takes the next number and never adopts a folder", () => {
    expect(newPieceFolder("Cuisine", existing)).toBe("3. Cuisine");
    expect(newPieceFolder("Vanité SDB des maitres", existing)).toBe(
      "3. Vanité SDB des maitres",
    );
  });
});

describe("planFolderAdoption", () => {
  const child = (id: string, name: string) => ({ id, name });

  it("adopts a numbered folder at project level as a piece", () => {
    const plan = planFolderAdoption(
      [child("a", "3. Salle de bain"), child("b", "Divers")],
      new Map(),
      "project",
    );
    expect(plan.pieces).toEqual([child("a", "3. Salle de bain")]);
    expect(plan.sections).toEqual([
      { id: "b", folder: "Divers", name: "Divers", isCustom: true },
    ]);
  });

  it("recognises a default project section by its folder name", () => {
    const plan = planFolderAdoption([child("p", "pdm")], new Map(), "project");
    expect(plan.sections).toEqual([
      { id: "p", folder: "pdm", name: "Prise de mesure", isCustom: false },
    ]);
  });

  it("names a hand-made piece section without its number", () => {
    const plan = planFolderAdoption(
      [child("x", "9. Divers"), child("y", "3. 3D")],
      new Map(),
      "piece",
    );
    expect(plan.sections).toEqual([
      { id: "y", folder: "3. 3D", name: "3D", isCustom: false },
      { id: "x", folder: "9. Divers", name: "Divers", isCustom: true },
    ]);
    expect(plan.pieces).toEqual([]);
  });

  it("never adopts a numbered folder as a piece inside a piece", () => {
    const plan = planFolderAdoption(
      [child("n", "4. Autre")],
      new Map(),
      "piece",
    );
    expect(plan.pieces).toEqual([]);
    expect(plan.sections).toHaveLength(1);
  });

  it("skips known folders, deleted ones included, and refreshes renamed ones", () => {
    const known = new Map([
      ["k1", "Divers"],
      ["k2", "Ancien nom"],
    ]);
    const plan = planFolderAdoption(
      [child("k1", "Divers"), child("k2", "Nouveau nom"), child("new", "Neuf")],
      known,
      "project",
    );
    expect(plan.refresh).toEqual([child("k2", "Nouveau nom")]);
    expect(plan.sections.map(({ id }) => id)).toEqual(["new"]);
    expect(plan.pieces).toEqual([]);
  });

  it("is stable: sorts new folders naturally", () => {
    const plan = planFolderAdoption(
      [child("b", "10. B"), child("a", "2. A")],
      new Map(),
      "project",
    );
    expect(plan.pieces.map(({ name }) => name)).toEqual(["2. A", "10. B"]);
  });
});
