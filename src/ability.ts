import * as Effect from "effect/Effect";
import * as Context from "effect/Context";
import * as Option from "effect/Option";
import * as Layer from "effect/Layer";

// Types of resources we want to protect
type ResourceType = "article" | "organization" | "comment";

// Possible actions on resources
type Action = "read" | "write" | "delete" | "create";

// Generic permission check result
interface PermissionCheckAllowed {
  type: "allowed";
}

interface PermissionCheckDenied {
  type: "denied";
  reason: string;
}

type PermissionCheckResult = PermissionCheckAllowed | PermissionCheckDenied;

// Generic capability check type that works with Effect
type CapabilityCheck<R = never> = (
  userId: string,
  resourceId: string
) => Effect.Effect<PermissionCheckResult, Error, R>;

// Core capability function type with resource and action
interface Capability<R = never> {
  resourceType: ResourceType;
  action: Action;
  check: CapabilityCheck<R>;
}

// Helper to create capability functions
const createCapability = <R>(
  resourceType: ResourceType,
  action: Action,
  check: CapabilityCheck<R>
): Capability<R> => ({
  resourceType,
  action,
  check,
});
