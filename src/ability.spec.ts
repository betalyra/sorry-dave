import { describe, expect } from "vitest";
import { it } from "@effect/vitest";

import { z } from "zod";
import { define, check, allowed, can, Denied } from "./ability";
import { Effect, Either } from "effect";

describe("Ability", () => {
  const Article = z.object({
    article: z.literal("article"),
    authorId: z.string(),
  });
  const Blog = z.object({ blog: z.literal("blog") });

  const blog = { blog: "blog" as const };

  const User = z.object({
    id: z.string(),
  });
  type User = z.infer<typeof User>;

  const article = { article: "article" as const, authorId: "1" };
  const schema = {
    "read-article": Article,
    "read-blog": Blog,
    "write-article": Article,
  };
  const capabilities = (user: User) =>
    define(schema)(function* () {
      yield* can("read-article");
      yield* can("read-blog");
      yield* can("write-article", (input) => input.authorId === user.id);
    });

  it.effect("should pass if the user has access to the resource", () =>
    Effect.gen(function* () {
      const user = { id: "1" };
      const checkResult = check(capabilities(user))(function* () {
        yield* allowed("read-article", article);
        yield* allowed("write-article", article);
      });

      const result = yield* checkResult.pipe(Effect.either);
      expect(result).toEqual(
        Either.right({ passed: ["read-article", "write-article"] })
      );
    })
  );
  it.effect(
    "should fail if the user does not have access to the resource",
    () =>
      Effect.gen(function* () {
        const user = { id: "2" };
        const checkResult = check(capabilities(user))(function* () {
          yield* allowed("write-article", article);
        });

        const result = yield* checkResult.pipe(Effect.either);
        expect(result).toStrictEqual(
          Either.left(
            new Denied({
              key: "write-article",
              message: "Denied: write-article",
            })
          )
        );
      })
  );
});
