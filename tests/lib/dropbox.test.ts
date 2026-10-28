import { describe, expect, it } from "vitest";

import {
  DROPBOX_UNNAMED_FOLDER,
  PIECE_SECTION_NAMES,
} from "@/constants/dropbox";
import {
  choosePieceFolder,
  chooseProjectFolder,
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

describe("chooseProjectFolder", () => {
  it("adopts a free folder with the same name", () => {
    expect(
      chooseProjectFolder("Beauregard Lacasse", ["beauregard lacasse"], []),
    ).toBe("beauregard lacasse");
  });

  it("does not adopt a folder claimed by another project", () => {
    expect(
      chooseProjectFolder(
        "Beauregard Lacasse",
        ["Beauregard Lacasse"],
        ["Beauregard Lacasse"],
      ),
    ).toBe("Beauregard Lacasse (2)");
  });

  it("uses the name when no folder exists", () => {
    expect(chooseProjectFolder("Tremblay Sophie", ["Autre"], [])).toBe(
      "Tremblay Sophie",
    );
  });
});

describe("choosePieceFolder", () => {
  const existing = ["PDM", "Finition", "2. Vanité SDB des maitres"];

  it("adopts an existing numbered folder with the same name", () => {
    expect(choosePieceFolder("Vanité SDB des maitres", existing, [])).toBe(
      "2. Vanité SDB des maitres",
    );
  });

  it("creates the next numbered folder otherwise", () => {
    expect(choosePieceFolder("Cuisine", existing, [])).toBe("3. Cuisine");
  });

  it("does not adopt a folder claimed by another piece", () => {
    expect(
      choosePieceFolder("Vanité SDB des maitres", existing, [
        "2. Vanité SDB des maitres",
      ]),
    ).toBe("3. Vanité SDB des maitres");
  });

  it("does not adopt an unnumbered project folder", () => {
    expect(choosePieceFolder("Finition", existing, [])).toBe("3. Finition");
  });
});
