import { Either, Schema } from "effect";
import { describe, expect, it } from "vitest";

import {
  JOBINE_DESCRIPTION_LENGTH_MESSAGE,
  JOBINE_DESCRIPTION_MAX_LENGTH,
  JOBINE_NAME_LENGTH_MESSAGE,
  JOBINE_NAME_MAX_LENGTH,
} from "@/constants/jobines";
import { INVALID_COLOR_MESSAGE } from "@/constants/projects";
import {
  AddJobineFormSchema,
  EditJobineFormSchema,
} from "@/schemas/jobines.schemas";

function decode<A, I>(schema: Schema.Schema<A, I>, input: unknown) {
  return Schema.decodeUnknownEither(schema, { errors: "all" })(input);
}

function failure(result: Either.Either<unknown, { message: string }>) {
  return Either.isLeft(result) ? result.left.message : "";
}

const valid = { name: "Tiroir", description: "", color: "#C9850C" };

describe("AddJobineFormSchema", () => {
  it("trims the title and description", () => {
    expect(
      decode(AddJobineFormSchema, {
        ...valid,
        name: "  Tiroir ",
        description: " Chez le client \n",
      }),
    ).toEqual(
      Either.right({ ...valid, name: "Tiroir", description: "Chez le client" }),
    );
  });

  it("accepts an empty description", () => {
    expect(decode(AddJobineFormSchema, valid)).toEqual(Either.right(valid));
  });

  it("rejects a title that is too short or too long", () => {
    for (const name of ["a", " b ", "x".repeat(JOBINE_NAME_MAX_LENGTH + 1)]) {
      expect(
        failure(decode(AddJobineFormSchema, { ...valid, name })),
      ).toContain(JOBINE_NAME_LENGTH_MESSAGE);
    }
  });

  it("rejects a description that is too long", () => {
    const description = "x".repeat(JOBINE_DESCRIPTION_MAX_LENGTH + 1);
    expect(
      failure(decode(AddJobineFormSchema, { ...valid, description })),
    ).toContain(JOBINE_DESCRIPTION_LENGTH_MESSAGE);
  });

  it("rejects an invalid color", () => {
    expect(
      failure(decode(AddJobineFormSchema, { ...valid, color: "amber" })),
    ).toContain(INVALID_COLOR_MESSAGE);
  });
});

describe("EditJobineFormSchema", () => {
  it("parses the jobine id", () => {
    expect(decode(EditJobineFormSchema, { ...valid, jobineId: "12" })).toEqual(
      Either.right({ ...valid, jobineId: 12 }),
    );
  });
});
