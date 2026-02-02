import type pino from "pino";
import type { Bunify, BunifyInstance } from "./bunify";

export class BunifyRequest {
  private readonly _bunify: Bunify
  private readonly _request: Request
  
  readonly log: pino.Logger
  readonly requestId: number | string

  get bunify(): BunifyInstance {
    return this._bunify
  }

  constructor(bunify: Bunify, request: Request, requestId: number | string) {
    this._bunify = bunify
    this._request = request
  
    this.requestId = requestId
    this.log = bunify.log.child({  })
  }
}