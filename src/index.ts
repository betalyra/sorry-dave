import { Context, Data, Effect, Either, Layer } from "effect";
import { z } from "zod";

class MyError extends Data.Error<{ message: string }> {}

type CapabilitiesCheck = (object: any) => boolean;

type ICapabilities = {
  capabilities: Map<string, CapabilitiesCheck>;
};

class Capabilities extends Context.Tag("Capabilities")<
  Capabilities,
  ICapabilities
>() {}

const can = <A extends string, O>(
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
    const result = check(object);
    if (!result) {
      return yield* Effect.fail(
        new MyError({ message: "Capability check failed" })
      );
    }
    return yield* Effect.succeed(undefined);
  });

const Article = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  authorId: z.string(),
});
export type Article = z.infer<typeof Article>;

const program = (userId: string) =>
  Effect.gen(function* () {
    const article = yield* Effect.succeed({
      id: "1",
      title: "My Article",
      content: "This is a test article",
      authorId: "1",
    });
    yield* can("read", article);
    yield* Effect.log("Article read");
  });

const capabilitiesForUser = (userId: string) =>
  Layer.effect(Capabilities)(
    Effect.gen(function* () {
      yield* Effect.log("Capabilities");
      return {
        capabilities: new Map([
          ["read", (article: Article) => article.authorId === userId],
        ]),
      };
    })
  );

const runnable = program("1").pipe(Effect.either);
const capabilities = capabilitiesForUser("1");
const provided = Effect.provide(runnable, capabilities);

const result = await Effect.runPromise(provided);

if (Either.isLeft(result)) {
  console.log("Left");
  console.error(result.left);
} else {
  console.log("Right");
  console.log(result.right);
}
