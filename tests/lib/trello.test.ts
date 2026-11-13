import { describe, expect, it } from "vitest";

import { TRELLO_EVENT_KINDS, TRELLO_WEBHOOK_PATH } from "@/constants/trello";
import {
  ProjectStage,
  TrelloCardState,
  TrelloCardVariant,
} from "@/generated/prisma/enums";
import {
  atelierVariants,
  boardWebhookStatus,
  cardEventFromAction,
  designCardName,
  designSubjects,
  isValidWebhookSignature,
  pieceCardDescription,
  pieceCardName,
  planCardEvent,
  planDesignCards,
  planVariantCards,
  stageForList,
  webhookCallbackUrl,
  webhookSignature,
  webhookStatus,
} from "@/lib/trello";
import type { TrelloAction } from "@/schemas/trello.schemas";

const { active, hidden, archived, lost } = TrelloCardState;
const { simple, caisson, finition } = TrelloCardVariant;

describe("designSubjects", () => {
  it("uses one project card until there are two phases", () => {
    expect(designSubjects([])).toEqual([null]);
    expect(designSubjects([7])).toEqual([null]);
    expect(designSubjects([7, 8])).toEqual([7, 8]);
  });
});

describe("planDesignCards", () => {
  it("does nothing when the cards already match", () => {
    expect(
      planDesignCards([{ id: 1, phaseId: null, state: active }], []),
    ).toEqual({ rebind: [], show: [], hide: [], create: [] });
  });

  it("turns the project card into phase 1 when the project is split", () => {
    expect(
      planDesignCards([{ id: 1, phaseId: null, state: active }], [10, 11]),
    ).toEqual({
      rebind: [{ id: 1, phaseId: 10 }],
      show: [],
      hide: [],
      create: [11],
    });
  });

  it("makes the first phase card the project card again when merged", () => {
    expect(
      planDesignCards(
        [
          { id: 1, phaseId: 10, state: active },
          { id: 2, phaseId: 11, state: active },
        ],
        [10],
      ),
    ).toEqual({
      rebind: [{ id: 1, phaseId: null }],
      show: [],
      hide: [2],
      create: [],
    });
  });

  it("brings hidden phase cards back when the project is split again", () => {
    expect(
      planDesignCards(
        [
          { id: 1, phaseId: null, state: active },
          { id: 2, phaseId: 11, state: hidden },
        ],
        [10, 11],
      ),
    ).toEqual({
      rebind: [{ id: 1, phaseId: 10 }],
      show: [2],
      hide: [],
      create: [],
    });
  });

  it("hides the card of a deleted phase", () => {
    expect(
      planDesignCards(
        [
          { id: 1, phaseId: 10, state: active },
          { id: 2, phaseId: 11, state: active },
          { id: 3, phaseId: 12, state: active },
        ],
        [10, 12],
      ),
    ).toEqual({ rebind: [], show: [], hide: [2], create: [] });
  });

  it("brings an archived design card back only on an explicit request", () => {
    const existing = [{ id: 1, phaseId: null, state: archived }];
    expect(planDesignCards(existing, [])).toEqual({
      rebind: [],
      show: [],
      hide: [],
      create: [],
    });
    expect(planDesignCards(existing, [], { reopen: true })).toEqual({
      rebind: [],
      show: [1],
      hide: [],
      create: [],
    });
  });

  it("never reuses lost or archived cards", () => {
    expect(
      planDesignCards(
        [
          { id: 1, phaseId: null, state: lost },
          { id: 2, phaseId: 11, state: archived },
        ],
        [10, 11],
      ),
    ).toEqual({ rebind: [], show: [], hide: [], create: [10] });
  });
});

describe("atelierVariants", () => {
  it("covers the four caisson / finition situations", () => {
    expect(atelierVariants({ hasCaisson: false, hasFinition: false })).toEqual([
      simple,
    ]);
    expect(atelierVariants({ hasCaisson: true, hasFinition: false })).toEqual([
      caisson,
    ]);
    expect(atelierVariants({ hasCaisson: true, hasFinition: true })).toEqual([
      caisson,
      finition,
    ]);
    expect(atelierVariants({ hasCaisson: false, hasFinition: true })).toEqual([
      finition,
    ]);
  });
});

describe("planVariantCards", () => {
  it("creates the missing variants", () => {
    expect(planVariantCards([], [caisson, finition])).toEqual({
      show: [],
      hide: [],
      create: [caisson, finition],
    });
  });

  it("hides a variant that is switched off", () => {
    expect(
      planVariantCards(
        [
          { id: 1, variant: caisson, state: active },
          { id: 2, variant: finition, state: active },
        ],
        [caisson],
      ),
    ).toEqual({ show: [], hide: [2], create: [] });
  });

  it("shows the same card again when the variant is switched back on", () => {
    expect(
      planVariantCards(
        [
          { id: 1, variant: caisson, state: active },
          { id: 2, variant: finition, state: hidden },
        ],
        [caisson, finition],
      ),
    ).toEqual({ show: [2], hide: [], create: [] });
  });

  it("leaves archived and lost cards alone", () => {
    expect(
      planVariantCards(
        [
          { id: 1, variant: caisson, state: archived },
          { id: 2, variant: finition, state: lost },
        ],
        [],
      ),
    ).toEqual({ show: [], hide: [], create: [] });
  });

  it("brings a card archived by hand back only on an explicit request", () => {
    const existing = [{ id: 1, variant: simple, state: archived }];
    expect(planVariantCards(existing, [simple])).toEqual({
      show: [],
      hide: [],
      create: [],
    });
    expect(planVariantCards(existing, [simple], { reopen: true })).toEqual({
      show: [1],
      hide: [],
      create: [],
    });
  });

  it("reopens every card on request, since Trello may have archived it unseen", () => {
    expect(
      planVariantCards(
        [
          { id: 1, variant: caisson, state: active },
          { id: 2, variant: finition, state: archived },
        ],
        [caisson, finition],
        { reopen: true },
      ),
    ).toEqual({ show: [1, 2], hide: [], create: [] });
  });

  it("replaces the simple card when a variant is switched on", () => {
    expect(
      planVariantCards([{ id: 1, variant: simple, state: active }], [caisson]),
    ).toEqual({ show: [], hide: [1], create: [caisson] });
  });
});

describe("card text", () => {
  it("names design cards after the project and phase", () => {
    expect(designCardName("Beauregard", null)).toBe("Beauregard");
    expect(designCardName("Beauregard", "Phase 2")).toBe(
      "Beauregard — Phase 2",
    );
  });

  it("names piece cards after the variant", () => {
    expect(pieceCardName("Beauregard", "Cuisine", simple)).toBe(
      "Beauregard — Cuisine",
    );
    expect(pieceCardName("Beauregard", "Cuisine", finition)).toBe(
      "Beauregard — Cuisine (Finition)",
    );
  });

  it("describes a piece with its filled fields", () => {
    expect(
      pieceCardDescription({
        description: "Îlot central",
        cladding: ["Placage noyer"],
        cabinetCount: 4,
        finish: "Vernis mat",
        caissonMaterial: "",
        countertop: "",
        drawers: "",
      }),
    ).toBe(
      "Îlot central\n\nHabillage : Placage noyer\nFinition : Vernis mat\nCaissons : 4",
    );
  });
});

const baseAction = {
  id: "a1",
  date: "2026-11-05T12:00:00.000Z",
  memberCreator: { fullName: "Patrice" },
} as const;

describe("cardEventFromAction", () => {
  it("reads a move between lists", () => {
    const action: TrelloAction = {
      ...baseAction,
      type: "updateCard",
      data: {
        card: { id: "c1" },
        board: { id: "b1" },
        listBefore: { id: "l1" },
        listAfter: { id: "l2" },
      },
    };
    expect(cardEventFromAction(action)).toMatchObject({
      kind: TRELLO_EVENT_KINDS.move,
      trelloCardId: "c1",
      fromBoardId: "b1",
      fromListId: "l1",
      toBoardId: "b1",
      toListId: "l2",
      actorName: "Patrice",
    });
  });

  it("reads a move to another board", () => {
    const action: TrelloAction = {
      ...baseAction,
      type: "moveCardToBoard",
      data: {
        card: { id: "c1" },
        board: { id: "b2" },
        boardSource: { id: "b1" },
        list: { id: "l9" },
      },
    };
    expect(cardEventFromAction(action)).toMatchObject({
      kind: TRELLO_EVENT_KINDS.move,
      fromBoardId: "b1",
      toBoardId: "b2",
      toListId: "l9",
    });
  });

  it("reads archiving and restoring", () => {
    const archive: TrelloAction = {
      ...baseAction,
      type: "updateCard",
      data: { card: { id: "c1", closed: true }, old: { closed: false } },
    };
    const restore: TrelloAction = {
      ...baseAction,
      type: "updateCard",
      data: { card: { id: "c1", closed: false }, old: { closed: true } },
    };
    expect(cardEventFromAction(archive)?.kind).toBe(TRELLO_EVENT_KINDS.archive);
    expect(cardEventFromAction(restore)?.kind).toBe(
      TRELLO_EVENT_KINDS.unarchive,
    );
  });

  it("reads a deletion", () => {
    const action: TrelloAction = {
      ...baseAction,
      type: "deleteCard",
      data: { card: { id: "c1" }, board: { id: "b1" }, list: { id: "l1" } },
    };
    expect(cardEventFromAction(action)).toMatchObject({
      kind: TRELLO_EVENT_KINDS.delete,
      fromListId: "l1",
    });
  });

  it("ignores renames and unrelated actions", () => {
    const rename: TrelloAction = {
      ...baseAction,
      type: "updateCard",
      data: { card: { id: "c1" }, old: {} },
    };
    const comment: TrelloAction = {
      ...baseAction,
      type: "commentCard",
      data: { card: { id: "c1" } },
    };
    expect(cardEventFromAction(rename)).toBeNull();
    expect(cardEventFromAction(comment)).toBeNull();
  });
});

describe("planCardEvent", () => {
  const card = { state: active, boardId: "b1", listId: "l1" };
  const stageLists = [{ stage: ProjectStage.production, listId: "l2" }];

  it("follows a move and resolves the stage of the new list", () => {
    expect(
      planCardEvent(
        card,
        { kind: TRELLO_EVENT_KINDS.move, toBoardId: "b2", toListId: "l2" },
        stageLists,
      ),
    ).toEqual({
      patch: { boardId: "b2", listId: "l2" },
      stage: ProjectStage.production,
    });
  });

  it("changes no stage for an unmapped list", () => {
    expect(
      planCardEvent(
        card,
        { kind: TRELLO_EVENT_KINDS.move, toBoardId: "b1", toListId: "l3" },
        stageLists,
      ),
    ).toEqual({ patch: { listId: "l3" }, stage: null });
  });

  it("ignores the echo of an archive the app caused", () => {
    expect(
      planCardEvent(
        { ...card, state: hidden },
        { kind: TRELLO_EVENT_KINDS.archive, toBoardId: null, toListId: null },
        stageLists,
      ).patch,
    ).toEqual({});
  });

  it("marks a human archive, restore and delete", () => {
    const event = { toBoardId: null, toListId: null };
    expect(
      planCardEvent(
        card,
        { kind: TRELLO_EVENT_KINDS.archive, ...event },
        stageLists,
      ).patch,
    ).toEqual({ state: archived });
    expect(
      planCardEvent(
        { ...card, state: archived },
        { kind: TRELLO_EVENT_KINDS.unarchive, ...event },
        stageLists,
      ).patch,
    ).toEqual({ state: active });
    expect(
      planCardEvent(
        card,
        { kind: TRELLO_EVENT_KINDS.delete, ...event },
        stageLists,
      ).patch,
    ).toEqual({ state: lost });
  });
});

describe("stageForList", () => {
  it("finds the stage of a mapped list", () => {
    const rows = [{ stage: ProjectStage.livraison, listId: "l5" }];
    expect(stageForList("l5", rows)).toBe(ProjectStage.livraison);
    expect(stageForList("l6", rows)).toBeNull();
    expect(stageForList(null, rows)).toBeNull();
  });
});

describe("webhook signature", () => {
  const body = '{"action":{}}';
  const callback = "https://versatyl.example/api/trello/webhook";

  it("accepts the signature computed with the secret", () => {
    const signature = webhookSignature(body, callback, "secret");
    expect(isValidWebhookSignature(body, callback, "secret", signature)).toBe(
      true,
    );
  });

  it("rejects a wrong secret, a tampered body and a missing signature", () => {
    const signature = webhookSignature(body, callback, "secret");
    expect(isValidWebhookSignature(body, callback, "other", signature)).toBe(
      false,
    );
    expect(
      isValidWebhookSignature(`${body} `, callback, "secret", signature),
    ).toBe(false);
    expect(isValidWebhookSignature(body, callback, "secret", null)).toBe(false);
    expect(isValidWebhookSignature(body, callback, "secret", "short")).toBe(
      false,
    );
  });

  it("builds the callback url from the app url", () => {
    expect(webhookCallbackUrl("https://versatyl.example/")).toBe(
      `https://versatyl.example${TRELLO_WEBHOOK_PATH}`,
    );
  });
});

describe("webhookStatus", () => {
  const current = "https://a.example/api/trello/webhook";

  it("is active when Trello calls the current address", () => {
    expect(
      webhookStatus({
        saved: true,
        remote: { callbackURL: current },
        remoteKnown: true,
        callbackUrl: current,
      }),
    ).toEqual({ status: "active", failures: 0 });
  });

  it("is stale when Trello still calls an old address", () => {
    expect(
      webhookStatus({
        saved: true,
        remote: {
          callbackURL: "https://old.example/api/trello/webhook",
          consecutiveFailures: 68,
        },
        remoteKnown: true,
        callbackUrl: current,
      }),
    ).toEqual({ status: "stale", failures: 68 });
  });

  it("is missing when Trello no longer has it, even if saved", () => {
    expect(
      webhookStatus({
        saved: true,
        remote: undefined,
        remoteKnown: true,
        callbackUrl: current,
      }).status,
    ).toBe("missing");
  });

  it("prefers the webhook calling the current address on a board", () => {
    const remote = [
      {
        idModel: "b1",
        callbackURL: "https://old.example/api/trello/webhook",
        consecutiveFailures: 12,
      },
      { idModel: "b1", callbackURL: current },
      { idModel: "b2", callbackURL: "https://old.example/api/trello/webhook" },
    ];
    const saved = new Set<string>();
    expect(
      boardWebhookStatus({
        boardId: "b1",
        saved,
        remote,
        callbackUrl: current,
      }),
    ).toEqual({ status: "active", failures: 0 });
    expect(
      boardWebhookStatus({ boardId: "b2", saved, remote, callbackUrl: current })
        .status,
    ).toBe("stale");
    expect(
      boardWebhookStatus({ boardId: "b3", saved, remote, callbackUrl: current })
        .status,
    ).toBe("missing");
  });

  it("falls back to what was saved when Trello cannot be reached", () => {
    expect(
      webhookStatus({
        saved: true,
        remote: undefined,
        remoteKnown: false,
        callbackUrl: null,
      }).status,
    ).toBe("active");
  });
});
