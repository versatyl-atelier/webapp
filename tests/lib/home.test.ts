import { describe, expect, it } from "vitest";

import {
  DEFAULT_HOME_LAYOUT,
  HOME_WIDGET_LINKS,
  HOME_WIDGETS,
} from "@/constants/home";
import { Role } from "@/generated/prisma/enums";
import {
  canFollowHomeLinks,
  homeLayoutForRole,
  homeProjectCards,
  homeWidgetLink,
} from "@/lib/home";
import type { HomeProject } from "@/lib/projectHome";

const project = (id: string): HomeProject => ({
  id,
  name: id,
  color: "#3B7DD8",
  stage: null,
  address: "",
  coverPieceId: null,
  coverUpdatedAt: null,
  coverX: 50,
  coverY: 50,
  coverZoom: 1,
});

describe("homeLayoutForRole", () => {
  it("shows every widget to employees and managers", () => {
    expect(homeLayoutForRole(DEFAULT_HOME_LAYOUT, Role.employee)).toEqual(
      DEFAULT_HOME_LAYOUT,
    );
    expect(homeLayoutForRole(DEFAULT_HOME_LAYOUT, Role.manager)).toEqual(
      DEFAULT_HOME_LAYOUT,
    );
  });

  it("hides the projects widget from the atelier role", () => {
    const widgets = homeLayoutForRole(DEFAULT_HOME_LAYOUT, Role.atelier).map(
      ({ widget }) => widget,
    );
    expect(widgets).toContain(HOME_WIDGETS.lanceur);
    expect(widgets).toContain(HOME_WIDGETS.week);
    expect(widgets).not.toContain(HOME_WIDGETS.projects);
  });
});

describe("home links", () => {
  it("lets only employees and up follow links", () => {
    expect(canFollowHomeLinks(Role.atelier)).toBe(false);
    expect(canFollowHomeLinks(Role.employee)).toBe(true);
  });

  it("drops the widget link when not interactive", () => {
    expect(homeWidgetLink(HOME_WIDGETS.lanceur, true)).toBe(
      HOME_WIDGET_LINKS.lanceur,
    );
    expect(homeWidgetLink(HOME_WIDGETS.lanceur, false)).toBeNull();
  });
});

describe("homeProjectCards", () => {
  it("puts pinned projects first and caps the count", () => {
    const cards = homeProjectCards(
      { pinned: [project("a"), project("b")], recent: [project("c")] },
      2,
    );
    expect(cards.map(({ id, pinned }) => [id, pinned])).toEqual([
      ["a", true],
      ["b", true],
    ]);
  });
});
