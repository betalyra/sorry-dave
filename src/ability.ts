// Generator that takes a key parameter and expects records with that key
import { StandardSchemaV1 } from "@standard-schema/spec";
import { z } from "zod";

function* can<
  T extends Record<`${string}-${string}`, StandardSchemaV1<any, any>>,
  K extends keyof T
>(
  key: K,
  // @ts-ignore
  check: (input: StandardSchemaV1.InferInput<T[K]>) => boolean
): Generator<string, undefined, T> {
  yield `Can ${key as string}`;
  return;
}

const gen =
  <T extends Record<string, StandardSchemaV1>>(record: T) =>
  (genCapabilities: () => Generator<string, void, T>) => {
    const it = genCapabilities();

    let items = [];
    while (true) {
      const next = it.next(record);
      if (next.done) {
        break;
      }
      items.push(next.value);
    }
    return items;
  };

const Article = z.object({ article: z.literal("article") });
const Blog = z.object({ blog: z.literal("blog") });

const article = { article: "article" as const };
const blog = { blog: "blog" as const };

const result = gen({ "read-article": Article, "read-blog": Blog })(
  function* () {
    yield* can("read-article", (input) => input.article === "article");
    yield* can("read-blog", (input) => input.blog === "blog");
  }
);

console.log(result);
