import { StandardSchemaV1 } from "@standard-schema/spec";
import { Data, Effect, Either } from "effect";

// Define a type constraint for valid keys
export type ValidKey = `${Lowercase<string>}-${Lowercase<string>}`;

// Define a generic schema type that enforces key and value constraints
export type SchemaDefinition = Record<ValidKey, StandardSchemaV1>;

// Extract the specific heterogeneous type from a schema object
export type ExtractSchemaType<T extends SchemaDefinition> = {
  [K in keyof T]: T[K];
};

// Function that accepts a schema and extracts its concrete type
export const register = <T extends Record<string, StandardSchemaV1>>(
  schema: T & { [K in keyof T]: K extends ValidKey ? unknown : never }
): ExtractSchemaType<
  T & { [K in keyof T]: K extends ValidKey ? unknown : never }
> => {
  return schema as any;
};

export const crud = <R extends `${Lowercase<string>}`, Input, Output>(
  resource: R,
  schema: StandardSchemaV1<Input, Output>
) => {
  type CrudOperations = {
    readonly [K in
      | "read"
      | "create"
      | "update"
      | "delete" as `${K}-${R}`]: StandardSchemaV1<Input, Output>;
  };

  return {
    [`read-${resource}`]: schema,
    [`create-${resource}`]: schema,
    [`update-${resource}`]: schema,
    [`delete-${resource}`]: schema,
  } as CrudOperations;
};

export type Check<E> = (
  input: StandardSchemaV1.InferInput<StandardSchemaV1>
) => boolean | Effect.Effect<boolean, E>;

export function* can<
  T extends Record<`${string}-${string}`, StandardSchemaV1<any, any>>,
  K extends keyof T,
  E = never
>(
  key: K,
  check?: (
    // @ts-ignore
    input: StandardSchemaV1.InferInput<T[K]>
  ) => boolean | Effect.Effect<boolean, E>
): Generator<[K, Check<E>], void, T> {
  const c = (check ?? (() => true)) as Check<E>;
  yield [key, c];
  return;
}

export const define =
  <T extends Record<string, StandardSchemaV1>>(
    capabilities: T & { [K in keyof T]: K extends ValidKey ? unknown : never }
  ) =>
  <E>(
    genCapabilities: () => Generator<
      [keyof ExtractSchemaType<typeof capabilities>, Check<E>],
      void,
      typeof capabilities
    >
  ): Capabilities<T, E> => {
    const it = genCapabilities();

    let checks = new Map<string, Check<E>>();
    while (true) {
      const next = it.next(capabilities as any);
      if (next.done) {
        break;
      }
      const [key, check] = next.value;
      checks.set(key as string, check as Check<E>);
    }
    return { checks, capabilities };
  };

export type Capabilities<T extends Record<string, StandardSchemaV1>, E> = {
  checks: Map<string, Check<E>>;
  capabilities: T;
};

export type CheckResult = {
  passed: string[];
};

export class Denied extends Data.Error<{ key: string; message: string }> {}

export const check =
  <E, T extends Record<string, StandardSchemaV1>>(
    capabilities: Capabilities<T, E>
  ) =>
  (
    genCapabilities: () => Generator<[string, any], void, T>
  ): Effect.Effect<CheckResult, Denied | E> =>
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
        const maybeCheck = checks.get(key);
        if (maybeCheck) {
          const result = maybeCheck(item);
          const check = Effect.isEffect(result) ? yield* result : result;
          passed.push(key);
          canResult = canResult && check;
        }
        if (!canResult) {
          yield* new Denied({ key, message: `Denied: ${key}` });
        }
      }
      return { passed };
    });

export function* allowed<
  T extends Record<`${string}-${string}`, StandardSchemaV1<any, any>>,
  K extends keyof T,
  // @ts-ignore
  I extends StandardSchemaV1.InferInput<T[K]>
>(key: K, item: I): Generator<[K, I], undefined, T> {
  yield [key, item];
  return;
}

// Helper type to extract all error types from your Generator
export type ExtractErrorTypes<T> = T extends Generator<infer Yield, any, any>
  ? Yield extends [string, Check<infer Error>]
    ? Error
    : never
  : never;
