# Sorry Dave

> I'm afraid I can't let you do that, Dave.

A simple authorisation library for [effect-ts](https://effect.website).

## Features

* 🔒 Type-safe
* 📋 [standard-schema](https://github.com/standard-schema/standard-schema) compliant
* 🚀 Easy to use
* 📝 Declarative
* ⚡ Fully `Effect` compatible
 
 ## Installation

```bash
pnpm i https://pkg.pr.new/betalyra/sorry-dave/@betalyra/sorry-dave@4f92a01
``` 

Npm publishing coming soon...
```bash
# npm
npm install @betalyra/sorry-dave

# pnpm
pnpm add @betalyra/sorry-dave

# yarn
yarn add @betalyra/sorry-dave
```

## Usage

Declare a schema for your capabilities using any standard-schema compliant library, e.g. [zod](https://zod.dev/).

```ts
import { z } from "zod";

// Define your model
const Article = z.object({
  article: z.literal("article"),
  authorId: z.string(),
});
const Blog = z.object({ blog: z.literal("blog") });
const User = z.object({ id: z.string() });
type User = z.infer<typeof User>;
  
// Define your capabilities using ${key}-${resource} naming convention
const Capabilities = z.object({
  "read-article": Article,
  "read-blog": Blog,
  "write-article": Article,
});
```

Define the capabilities that the user has.

```ts
const capabilities = (user: User) =>
    define(schema)(function* () {
      yield* can("read-article");
      yield* can("read-blog");
      yield* can("write-article", (input) => Effect.sync(() => input.authorId === user.id)); // return an Effect<boolean> or boolean
    });
```

Check if the user has access to the resource.

```ts
const user = { id: "1" };
const article = { article: "article" as const, authorId: "1" };
// Will fail with a Denied error if the user does not have access to the resource
yield* check(capabilities(user))(function* () {
  yield* allowed("read-article", article);
  yield* allowed("write-article", article);
});
```
