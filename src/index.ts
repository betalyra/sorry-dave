// Core functionality
export { check, define, can, allowed, register, crud } from "./ability.js";

// Type definitions
export type {
  Check,
  Capabilities,
  CheckResult,
  ValidKey,
  SchemaDefinition,
  ExtractSchemaType,
} from "./ability.js";

// Error classes
export { Denied } from "./ability.js";
