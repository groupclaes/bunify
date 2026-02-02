import type pino from "pino";
import type { Bunify, BunifyInstance } from "./bunify";
import { BunifyError } from "./errors/bunify-error";
import type { BunRequest } from "bun";

export class BunifyRequest implements BunRequest {
  private readonly _bunify: Bunify
  private readonly _request: BunRequest

  readonly requestId: string | number
  readonly log: pino.Logger | undefined


  /**
   * Parent bunify instance serving the request
   */
  get bunify(): BunifyInstance {
    return this._bunify
  }

  get params() {
    return this._request.params
  }

  get cookies() {
    return this._request.cookies
  }

  get headers() {
    return this._request.headers
  }

  get cache() {
    return this._request.cache
  }

  get credentials() {
    return this._request.credentials
  }

  get integrity() {
    return this._request.integrity
  }

  get method() {
    return this._request.method
  }

  get mode() {
    return this._request.mode
  }

  get redirect() {
    return this._request.redirect
  }

  get referrer() {
    return this._request.referrer
  }

  get referrerPolicy() {
    return this._request.referrerPolicy
  }

  get url() {
    return this._request.url
  }

  get keepalive() {
    return this._request.keepalive
  }

  get signal() {
    return this._request.signal
  }

  get duplex() {
    return this._request.duplex
  }

  get clone() {
    return this._request.clone
  }

  get destination() {
    return this._request.destination
  }

  get body() {
    return this._request.body
  }

  get bodyUsed() {
    return this._request.bodyUsed
  }

  get arrayBuffer() {
    return this._request.arrayBuffer
  }

  get blob() {
    return this._request.blob
  }

  get bytes() {
    return this._request.bytes
  }

  get formData() {
    return this._request.formData
  }

  get json() {
    return this._request.json
  }

  get text() {
    return this._request.text
  }


  constructor(bunify: Bunify, request: BunRequest) {
    this._bunify = bunify
    this._request = request

    this.requestId = this.getRequestId()

    if (bunify.requestOptions?.logEcsFields) {
      this.log = bunify.log?.child({
        http: {
          request: {
            id: this.requestId,
            method: this._request.method,
            referrer: this._request.referrer,
            mime_type: this._request.headers.get('content-type'),
            body: {
              bytes: this._request.headers.get('content-length')
            }
          }
        }
      })
    } else {
      this.log = bunify.log?.child({ 'reqId': this.requestId })
    }
  }

  /**
   * Extract the request id from the header
   */
  private getRequestId(): string | number {
    if (this._bunify.requestOptions?.genReqId)
      return this._bunify.requestOptions.genReqId(this._request)

    throw new BunifyError('No correct requestId handler has been configured!')
  }
}