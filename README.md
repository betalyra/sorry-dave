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

Npm registry packages coming soon...
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
  "write-blog": Blog,
});
```

Define the capabilities that the user has.

```ts
const capabilities = (user: User) =>
    define(schema)(function* () {
      yield* can("read-article"); // Anyone can read an article
      yield* can("read-blog"); // Anyone can read a blog
      yield* can("write-article", (input) =>  input.authorId === user.id); // Only the author can write an article
      yield* can("write-blog", (input) => Effect.sync(() => input.authorId === user.id)); // Can also use Effects in the conditions
    });
```

Validate if the user has access to a resource by yielding the check

**Valid case**
```ts
const user = { id: "1" };
const article = { article: "article" as const, authorId: "1" };

yield* check(capabilities(user))(function* () {
  yield* allowed("read-article", article);
  yield* allowed("write-article", article);
});
```

**Invalid case**
```ts
const user = { id: "1" };
const article = { article: "article" as const, authorId: "2" };
// Will fail with a Denied error
yield* check(capabilities(user))(function* () {
  yield* allowed("read-article", article);
  yield* allowed("write-article", article);
});
```
