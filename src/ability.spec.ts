import { describe, expect } from "vitest";
import { it } from "@effect/vitest";

import { z } from "zod";
import { define, check, allowed, can, Denied, Registry } from "./ability";
import { Data, Effect, Either } from "effect";
import { TestServices } from "effect/TestServices";

class TestError extends Data.Error<{ message: string }> {}

describe("Ability", () => {
  const Article = z.object({
    article: z.literal("article"),
    authorId: z.string(),
  });
  const Blog = z.object({ blog: z.literal("blog"), authorId: z.string() });
  const User = z.object({
    id: z.string(),
  });
  type User = z.infer<typeof User>;

  const schema: Registry = {
    "read-article": Article,
    "read-blog": Blog,
    "write-article": Article,
    "write-blog": Blog,
  };
  const capabilities = (user: User) =>
    define(schema)(function* () {
      yield* can("read-article");
      yield* can("read-blog");
      yield* can("write-article", (input) => input.authorId === user.id);
      yield* can("write-blog", (input) =>
        Effect.sync(() => input.authorId === user.id)
      );
    });

  it.effect("should pass if the user has access to the resource", () =>
    Effect.gen(function* () {
      const user = { id: "1" };
      const article = { article: "article" as const, authorId: "1" };
      const checkResult = check(capabilities(user))(function* () {
        yield* allowed("read-article", article);
        yield* allowed("write-article", article);
      });

      const result = yield* checkResult.pipe(Effect.either);
      expect(result).toStrictEqual(
        Either.right({ passed: ["read-article", "write-article"] })
      );
    })
  );
  it.effect(
    "should fail if the user does not have access to the resource",
    () =>
      Effect.gen(function* () {
        const user = { id: "1" };
        const article = { article: "article" as const, authorId: "2" };
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
  it.effect(
    "should execute an effect in the condition if the user has access to the resource",
    () =>
      Effect.gen(function* () {
        const user = { id: "1" };
        const blog = { blog: "blog" as const, authorId: "1" };

        let counter = 0;
        const capabilities = (user: User) =>
          define(schema)(function* () {
            yield* can("write-blog", (input) =>
              Effect.sync(() => {
                counter++;
                console.log("counter", counter);
                return input.authorId === user.id;
              })
            );
          });

        const checkResult = check(capabilities(user))(function* () {
          yield* allowed("write-blog", blog);
        });

        const result = yield* checkResult.pipe(Effect.either);
        expect(result).toEqual(Either.right({ passed: ["write-blog"] }));
        expect(counter).toEqual(1);
      })
  );
  it.effect(
    "should execute an effect in the condition and fail if the effect fails",
    () =>
      Effect.gen(function* () {
        const user = { id: "1" };
        const blog = { blog: "blog" as const, authorId: "1" };

        const capabilities = (user: User) =>
          define(schema)(function* () {
            yield* can("write-blog", (input) =>
              Effect.gen(function* () {
                yield* Effect.fail(new TestError({ message: "test" }));
                return input.authorId === user.id;
              })
            );
          });

        const checkResult = check(capabilities(user))(function* () {
          yield* allowed("write-blog", blog);
        });

        const result = yield* checkResult.pipe(Effect.either);
        expect(result).toEqual(Either.left(new TestError({ message: "test" })));
      })
  );
});
