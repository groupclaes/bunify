import type { Bunify } from "../bunify";
import type { RequestRoute } from "./request-route";

export type BunifyHook = BunifyGenericHook | BunifyAnyAdditionalHook | BunifyOnRequestHook
export type BunifyGenericHook = (bunify: Bunify) => Bun.MaybePromise<void>
export type BunifyAnyAdditionalHook = (bunify: Bunify, anything?: any) => Bun.MaybePromise<void>
export type BunifyOnRequestHook = (bunify: Bunify, requestOptions?: RequestRoute) => Bun.MaybePromise<void>