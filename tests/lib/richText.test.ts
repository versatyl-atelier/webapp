import { describe, expect, it } from "vitest";

import {
  colorFromCss,
  normalizeRuns,
  normalizeStoredRichText,
  parseRichText,
  richTextFromDom,
  richTextPlainLength,
  serializeRichText,
  type RichNode,
} from "@/lib/richText";

function text(value: string): RichNode {
  return {
    nodeType: 3,
    nodeName: "#text",
    nodeValue: value,
    childNodes: [],
  };
}

function element(
  nodeName: string,
  children: RichNode[] = [],
  extra: Partial<RichNode> = {},
): RichNode {
  return {
    nodeType: 1,
    nodeName,
    nodeValue: null,
    childNodes: children,
    ...extra,
  };
}

describe("parseRichText", () => {
  it("treats legacy plain text as a single run", () => {
    expect(parseRichText("liv 12 nov.")).toEqual([{ text: "liv 12 nov." }]);
  });

  it("reads stored runs and ignores unknown colors", () => {
    const stored = JSON.stringify([
      { t: "a", b: true, c: "red" },
      { t: "b", c: "pink" },
    ]);
    expect(parseRichText(stored)).toEqual([
      { text: "a", bold: true, color: "red" },
      { text: "b" },
    ]);
  });

  it("falls back to plain text for malformed json", () => {
    expect(parseRichText("[oops")).toEqual([{ text: "[oops" }]);
    expect(parseRichText('[{"x":1}]')).toEqual([{ text: '[{"x":1}]' }]);
  });
});

describe("serializeRichText", () => {
  it("stores unformatted text as plain text", () => {
    expect(serializeRichText([{ text: "bonjour" }])).toBe("bonjour");
    expect(serializeRichText([])).toBe("");
  });

  it("round-trips formatted runs", () => {
    const runs = [
      { text: "a ", bold: true as const },
      { text: "b", italic: true as const, color: "green" as const },
    ];
    expect(parseRichText(serializeRichText(runs))).toEqual(runs);
  });

  it("keeps plain text that starts with a bracket intact", () => {
    const stored = serializeRichText([{ text: "[urgent] appeler" }]);
    expect(parseRichText(stored)).toEqual([{ text: "[urgent] appeler" }]);
  });

  it("merges adjacent runs with the same format", () => {
    expect(normalizeRuns([{ text: "a" }, { text: "" }, { text: "b" }])).toEqual(
      [{ text: "ab" }],
    );
    expect(normalizeStoredRichText("x")).toBe("x");
  });

  it("measures the visible length", () => {
    expect(
      richTextPlainLength(
        serializeRichText([{ text: "ab", bold: true }, { text: "cd" }]),
      ),
    ).toBe(4);
  });
});

describe("colorFromCss", () => {
  it("maps palette colors from hex and rgb", () => {
    expect(colorFromCss("#DC2626")).toBe("red");
    expect(colorFromCss("rgb(5, 150, 105)")).toBe("green");
    expect(colorFromCss("#123456")).toBeUndefined();
    expect(colorFromCss(null)).toBeUndefined();
  });
});

describe("richTextFromDom", () => {
  it("reads tags, color attributes and line breaks", () => {
    const root = element("DIV", [
      text("a "),
      element("B", [text("gras")]),
      element("BR"),
      element("FONT", [text("rouge")], {
        getAttribute: (name) => (name === "color" ? "#dc2626" : null),
      }),
    ]);
    expect(richTextFromDom(root)).toEqual([
      { text: "a " },
      { text: "gras", bold: true },
      { text: "\n" },
      { text: "rouge", color: "red" },
    ]);
  });

  it("reads css-styled spans", () => {
    const root = element("DIV", [
      element("SPAN", [text("x")], {
        style: {
          fontWeight: "700",
          fontStyle: "italic",
          textDecorationLine: "underline",
          color: "rgb(37, 99, 235)",
        },
      }),
    ]);
    expect(richTextFromDom(root)).toEqual([
      { text: "x", bold: true, italic: true, underline: true, color: "blue" },
    ]);
  });

  it("separates block elements with a newline and trims the end", () => {
    const root = element("DIV", [
      element("DIV", [text("une")]),
      element("DIV", [text("deux")]),
      element("BR"),
    ]);
    expect(richTextFromDom(root)).toEqual([{ text: "une\ndeux" }]);
  });
});
