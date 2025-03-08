// Core functionality
export { check, define, can, allowed, register } from "./ability";

// Type definitions
export type {
  Check,
  Capabilities,
  CheckResult,
  ValidKey,
  SchemaDefinition,
} from "./ability";

// Error classes
export { Denied } from "./ability";
