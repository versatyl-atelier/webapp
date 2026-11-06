import { Either, Schema } from "effect";
import { describe, expect, it } from "vitest";

import { INVALID_COLOR_MESSAGE } from "@/constants/projects";
import {
  SUBTASK_NAME_LENGTH_MESSAGE,
  SUBTASK_NAME_MAX_LENGTH,
  TASK_NAME_LENGTH_MESSAGE,
} from "@/constants/tasks";
import {
  AddSubtaskFormSchema,
  AddTaskFormSchema,
  EditTaskFormSchema,
} from "@/schemas/tasks.schemas";

function decode<A, I>(schema: Schema.Schema<A, I>, input: unknown) {
  return Schema.decodeUnknownEither(schema, { errors: "all" })(input);
}

function failure(result: Either.Either<unknown, { message: string }>) {
  return Either.isLeft(result) ? result.left.message : "";
}

describe("AddTaskFormSchema", () => {
  it("trims the name and keeps a valid color", () => {
    const result = decode(AddTaskFormSchema, {
      name: "  Fabrication ",
      color: "#3498db",
    });
    expect(result).toEqual(
      Either.right({ name: "Fabrication", color: "#3498db" }),
    );
  });

  it("rejects a name that is too short or too long", () => {
    for (const name of ["a", " b ", "x".repeat(31)]) {
      const result = decode(AddTaskFormSchema, { name, color: "#3498db" });
      expect(failure(result)).toContain(TASK_NAME_LENGTH_MESSAGE);
    }
  });

  it("rejects a color that is not a 6-digit hex", () => {
    const result = decode(AddTaskFormSchema, { name: "Ok", color: "blue" });
    expect(failure(result)).toContain(INVALID_COLOR_MESSAGE);
  });
});

describe("EditTaskFormSchema", () => {
  it("reads the task id from the form string", () => {
    const result = decode(EditTaskFormSchema, {
      taskId: "12",
      name: "Finition",
      color: "#ff0000",
    });
    expect(result).toEqual(
      Either.right({ taskId: 12, name: "Finition", color: "#ff0000" }),
    );
  });
});

describe("AddSubtaskFormSchema", () => {
  it("trims the name and allows spaces, symbols and accents", () => {
    const result = decode(AddSubtaskFormSchema, {
      name: " Armoire cuisine - façade #2 ",
    });
    expect(result).toEqual(
      Either.right({ name: "Armoire cuisine - façade #2" }),
    );
  });

  it("accepts a name up to the maximum length", () => {
    const name = "x".repeat(SUBTASK_NAME_MAX_LENGTH);
    expect(Either.isRight(decode(AddSubtaskFormSchema, { name }))).toBe(true);
  });

  it("rejects an empty or too long name", () => {
    for (const name of ["", "   ", "x".repeat(SUBTASK_NAME_MAX_LENGTH + 1)]) {
      const result = decode(AddSubtaskFormSchema, { name });
      expect(failure(result)).toContain(SUBTASK_NAME_LENGTH_MESSAGE);
    }
  });
});
