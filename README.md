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

Declare a schema for your capabilities using any [standard-schema](https://github.com/standard-schema/standard-schema) compliant library, e.g. [zod](https://zod.dev/).

```ts
import { z } from "zod";

// Define your domain model
const Article = z.object({
  article: z.literal("article"),
  authorId: z.string(),
});
const Blog = z.object({ blog: z.literal("blog"), authorId: z.string() });
const User = z.object({ id: z.string() });
type User = z.infer<typeof User>;

``` 
Next, register your schemas using the `${key}-${resource}` naming convention.
```ts
const registry = {
  "read-article": Article,
  "read-blog": Blog,
  "write-article": Article,
  "write-blog": Blog,
};
```

Next, define a set of capabilities from the registry that your entity (the user) has.
```ts
const capabilities = (user: User) =>
    define(registry)(function* () {
      yield* can("read-article"); // Anyone can read an article
      yield* can("read-blog"); // Anyone can read a blog
      // Add a condition to the capability
      yield* can("write-article", (input) =>  input.authorId === user.id); // Only the author can write an article
      yield* can("write-blog", (input) => Effect.sync(() => input.authorId === user.id)); // You can also use Effects in conditions
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
const article = { article: "article" as const, authorId: "2" }; // The authorId does not match the user's id
// Will fail with a Denied error
yield* check(capabilities(user))(function* () {
  yield* allowed("read-article", article);
  yield* allowed("write-article", article);
});
```
