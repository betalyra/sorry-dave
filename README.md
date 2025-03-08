# Sorry Dave

> I'm afraid I can't let you do that, Dave.

A simple authorisation library for [effect-ts](https://effect.website).



https://github.com/user-attachments/assets/071ffe2e-1993-458c-8cc8-a13b640220cb



## Features

* 🔒 Type-safe
* 📋 [standard-schema](https://github.com/standard-schema/standard-schema) compliant
* 🚀 Easy to use
* 📝 Declarative
* ⚡ Fully `Effect` compatible
 
 ## Installation

```bash
pnpm i https://pkg.pr.new/betalyra/sorry-dave/@betalyra/sorry-dave@4ea2ba7
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

## Getting started

sorry-dave consists of three building blocks:

* **Schema registry**: Maps your domain objects to resource identifiers
* **Capabilities**: Defines what your entity (usually the user) is allowed to do and under what conditions
* **Check**: A check used in your program to validate that your entity (user) has sufficient permissions

Let's go through them:

### 1. Schema

Declare a schema for your capabilities using any [standard-schema](https://github.com/standard-schema/standard-schema) compliant library, e.g. [zod](https://zod.dev/).

```ts
// Define your domain model
const Article = z.object({
  article: z.literal("article"),
  authorId: z.string(),
});
const Blog = z.object({ blog: z.literal("blog"), authorId: z.string() });
const User = z.object({ id: z.string() });
type User = z.infer<typeof User>;
``` 

Next, register your schemas. Keys must be lowercase in the form of *action-resource*.

```ts
const registry = register({
  "read-article": Article,
  "read-blog": Blog,
  "write-article": Article,
  "write-blog": Blog,
});
```

### 2. Capabilities

Now that we have our registry up and running, let's define a set of capabilities that your entity (the user) has.
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

### 3. Check

Finally we can check within our program whether the entity is allowed to perform certain actions:

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

## Advanced usage

### CRUD
You can easily register CRUD actions using the `crud` helper:
```ts
const registry = register({
  ...crud("blog", Blog),
  ...crud("article", Article),
});
```

## Credits

This library was heavily inspired by [CASL](https://casl.js.org/v6/en/).

## License

[MIT](./LICENSE.md)
