// Core functionality
export { check, define, can, allowed, register, crud } from "./ability";

// Type definitions
export type {
  Check,
  Capabilities,
  CheckResult,
  ValidKey,
  SchemaDefinition,
  ExtractSchemaType,
} from "./ability";

// Error classes
export { Denied } from "./ability";
