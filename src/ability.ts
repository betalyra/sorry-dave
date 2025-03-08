import { StandardSchemaV1 } from "@standard-schema/spec";
import { Data, Effect, Either } from "effect";

export type Check = (
  input: StandardSchemaV1.InferInput<StandardSchemaV1>
) => boolean | Effect.Effect<boolean>;

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
): Generator<[K, Check], undefined, T> {
  const c = (check ?? (() => true)) as Check;
  yield [key, c];
  return;
}

export const define =
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

export type Capabilities<T extends Record<string, StandardSchemaV1>> = {
  checks: Map<string, Check>;
  capabilities: T;
};

export type CheckResult = {
  passed: string[];
};

export class Denied extends Data.Error<{ key: string; message: string }> {}

export const check =
  <E, T extends Record<string, StandardSchemaV1>>(
    capabilities: Capabilities<T>
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
          if (Effect.isEffect(result)) {
            const check = yield* result;
            passed.push(key);
            canResult = canResult && check;
          } else {
            passed.push(key);
            canResult = canResult && result;
          }
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
