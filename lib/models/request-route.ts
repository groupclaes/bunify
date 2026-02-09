import type { BunRequest } from "bun"
import type { BunifyRequest, RequestLifecycle } from "../request"
import type { BunifyResponse } from "../response"


export type RequestMethod = "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "TRACE" | "PATCH" 
export type RequestHookResult = BunifyResponse | Response | void | Promise<BunifyResponse | Response | void>
export type RequestHook = (request: BunifyRequest, response: BunifyResponse) => RequestHookResult

export type RequestHandlerFunctionResult = BunifyResponse | Response | Promise<BunifyResponse | Response>
export type RequestHandlerFunction = (request: BunifyRequest, response: BunifyResponse) => RequestHandlerFunctionResult

export type RequestHandler = BunifyResponse | Response | RequestHandlerFunction

export type RequestHookOrHandler = RequestHandlerFunction | RequestHook | RequestHook[]

export interface RequestRoute {
  /**
   * URL to serve the handler at
   */
  url: string,
  /**
   * Request method type
   * @default "GET"
   */
  method?: RequestMethod | RequestMethod[],
  /**
   * Time in milliseconds before a request should be timed out
   */
  timeout?: number,


  /**
   * Actual request handler to execute after the pre-hooks, and before the post-hooks
   */
  handler: RequestHandlerFunction

  /**
   * Lifecycle hooks ran as last hook after te Bunify configured hooks
   */
  hooks?: Record<RequestLifecycle, RequestHook | RequestHook[]>
}

/**
 * A request route with the internal handler used by Bun.serve
 * 
 * @internal
 */
export interface _RequestRoute extends RequestRoute {
  internalHandler: (request: BunRequest, server?: Bun.Server<any>) => Promise<Response>
}