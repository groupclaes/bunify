import type { ErrorLike } from "bun";

export class BunifyError extends Error {}

export class BunifyOptionsError extends BunifyError {}
