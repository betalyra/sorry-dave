import { Context, Data, Effect, Either, Layer, Logger, LogLevel } from "effect";
import { YieldWrap } from "effect/Utils";
import type { StandardSchemaV1 } from "@standard-schema/spec";

import { z } from "zod";

class MyError extends Data.Error<{ message: string }> {}

type CapabilitiesCheck = (object: any) => Effect.Effect<boolean> | boolean;

type ICapabilities = {
  capabilities: Map<string, CapabilitiesCheck>;
};

class Capabilities extends Context.Tag("Capabilities")<
  Capabilities,
  ICapabilities
>() {}

const gen = (
  genCapabilities: () => Generator<[string, CapabilitiesCheck]>
): Effect.Effect<Map<string, CapabilitiesCheck>> =>
  Effect.gen(function* () {
    const capabilities = new Map<string, CapabilitiesCheck>();
    yield* Effect.logDebug("Generating capabilities");
    for (const [action, check] of genCapabilities()) {
      yield* Effect.logDebug("Adding capability", action);
      capabilities.set(action, check);
    }
    return capabilities;
  });

const isAllowed = <A extends string, O>(
  action: A,
  object: O
): Effect.Effect<void, MyError, Capabilities> =>
  Effect.gen(function* () {
    yield* Effect.log("Can", action, object);
    const capabilities = yield* Capabilities;
    const check = capabilities.capabilities.get(action);
    if (!check) {
      return yield* Effect.fail(
        new MyError({ message: "Capability not found" })
      );
    }
    const resultEffect = check(object);
    if (Effect.isEffect(resultEffect)) {
      const result = yield* resultEffect;
      if (!result) {
        return yield* Effect.fail(
          new MyError({ message: "Capability check failed" })
        );
      }
    } else {
      const result = resultEffect;
      if (!result) {
        return yield* Effect.fail(
          new MyError({ message: "Capability check failed" })
        );
      }
    }
    return;
  });

const can = function* <A extends string, S extends StandardSchemaV1>(
  action: A,
  schema: S,
  check?: (
    input: StandardSchemaV1.InferInput<S>
  ) => Effect.Effect<void, MyError, Capabilities> | boolean
): Generator<[typeof action, CapabilitiesCheck], undefined, undefined> {
  const result = check
    ? ([action, check] as [A, CapabilitiesCheck])
    : ([action, () => Effect.succeed(true)] as [A, CapabilitiesCheck]);
  yield result;
  return;
};

const Article = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  authorId: z.string(),
});
export type Article = z.infer<typeof Article>;

const capabilitiesForUser = (userId: string) =>
  Layer.effect(Capabilities)(
    Effect.gen(function* () {
      yield* Effect.logDebug("Creating capabilities for user", userId);

      const capabilities = yield* gen(function* () {
        yield* can("read", Article);
        yield* can(
          "update",
          Article,
          (article: Article) => article.authorId === userId
        );
        yield* can("delete", Article, (article: Article) =>
          Effect.succeed(article.authorId === userId)
        );
      });
      yield* Effect.logDebug("Capabilities created", capabilities);
      return {
        capabilities,
      };
    })
  );

const capabilities = capabilitiesForUser("1");

const program = (article: Article) =>
  Effect.gen(function* () {
    yield* isAllowed("update", article);
    yield* Effect.log("Article read", article);
  });

const runnable = program({
  id: "1",
  title: "My Article",
  content: "This is a test article",
  authorId: "2",
});

const provided = runnable.pipe(
  Effect.provide(
    Layer.provideMerge(
      Layer.mergeAll(capabilities),
      Layer.mergeAll(Logger.pretty, Logger.minimumLogLevel(LogLevel.Debug))
    )
  ),
  Effect.either
);

const result = await Effect.runPromise(provided);
if (Either.isLeft(result)) {
  console.log("Left");
  console.error(result.left);
} else {
  console.log("Right");
  console.log(result.right);
}
