// Generator that takes a key parameter and expects records with that key
import { StandardSchemaV1 } from "@standard-schema/spec";
import { Data, Effect } from "effect";
import { z } from "zod";

type Check = (input: StandardSchemaV1.InferInput<StandardSchemaV1>) => boolean;

function* can<
  T extends Record<`${string}-${string}`, StandardSchemaV1<any, any>>,
  K extends keyof T
>(
  key: K,
  // @ts-ignore
  check?: (input: StandardSchemaV1.InferInput<T[K]>) => boolean
): Generator<[K, Check], undefined, T> {
  const c = (check ?? (() => true)) as Check;
  yield [key, c];
  return;
}

const gen =
  <T extends Record<string, StandardSchemaV1>>(capabilities: T) =>
  (genCapabilities: () => Generator<[string, Check], void, T>) => {
    const it = genCapabilities();

    let checks = new Map<string, Check>();
    while (true) {
      const next = it.next(capabilities);
      if (next.done) {
        break;
      }
      const [key, check] = next.value;
      checks.set(key, check);
    }
    return { checks, capabilities };
  };

type Capabilities<T extends Record<string, StandardSchemaV1>> = {
  checks: Map<string, Check>;
  capabilities: T;
};

type CheckResult = {
  passed: string[];
};

class Denied extends Data.Error<{ key: string; message: string }> {}

const check =
  <T extends Record<string, StandardSchemaV1>>(capabilities: Capabilities<T>) =>
  (
    genCapabilities: () => Generator<[string, any], void, T>
  ): Effect.Effect<CheckResult, Denied> =>
    Effect.gen(function* () {
      const it = genCapabilities();

      const checks = capabilities.checks;
      let passed: string[] = [];
      let canResult = true;
      while (true) {
        const next = it.next(capabilities.capabilities);
        if (next.done) {
          break;
        }
        const [key, item] = next.value;
        const check = checks.get(key);
        if (check) {
          passed.push(key);
          canResult = canResult && check(item);
        }
        if (!canResult) {
          yield* new Denied({ key, message: `Denied: ${key}` });
        }
      }
      return { passed };
    });

function* allowed<
  T extends Record<`${string}-${string}`, StandardSchemaV1<any, any>>,
  K extends keyof T,
  // @ts-ignore
  I extends StandardSchemaV1.InferInput<T[K]>
>(key: K, item: I): Generator<[K, I], undefined, T> {
  yield [key, item];
  return;
}
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

const user = { id: "1" };
const article = { article: "article" as const, authorId: "2" };

const allCapabilities = {
  "read-article": Article,
  "read-blog": Blog,
  "write-article": Article,
};
const capabilities = (user: User) =>
  gen(allCapabilities)(function* () {
    yield* can("read-article");
    yield* can("read-blog");
    yield* can("write-article", (input) => input.authorId === user.id);
  });

const checkResult = check(capabilities(user))(function* () {
  yield* allowed("read-article", article);
  yield* allowed("write-article", article);
});

const result = await Effect.runPromise(checkResult.pipe(Effect.either));
console.log(result);
