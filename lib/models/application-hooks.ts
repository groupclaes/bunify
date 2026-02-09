import type { Bunify } from "../bunify";

export type BunifyHook = BunifyGenericHook | BunifyAnyAdditionalHook
export type BunifyGenericHook = (bunify: Bunify) => Bun.MaybePromise<void>
export type BunifyAnyAdditionalHook = (bunify: Bunify, ...anything: any[]) => Bun.MaybePromise<void>