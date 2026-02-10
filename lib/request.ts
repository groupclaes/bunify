import type { Bunify } from "./bunify";
import type { BunRequest } from "bun";
import type { RequestRoute } from "./models/request-route";
import { BUNIFY_ERR_REQUEST_INVALID_REQID_HANDLER } from "./errors";
import type { Logger } from "@logtape/logtape";


export enum RequestLifecycle {
  /**
   * First call ran right after a request is received, and the id has been generated
   */
  OnRequest = 'onRequest',
  PreParsing = 'preParsing',
  PreValidation = 'preValidation',
  PreHandler = 'preHandler',
  PreSerialization = 'preSerialization',
  OnError = 'onError',
  OnSend = 'onSend',
  OnResponse = 'onResponse',
  OnTimeout = 'onTimeout',
  OnRequestAbort = 'onRequestAbort'
}

export class BunifyRequest implements BunRequest {
  private readonly _request: BunRequest
  private _clientIp?: string
  private _clientPort?: number
  private _clientIpFamily?: 'IPv6' | 'IPv4'

  /**
   * Parent bunify instance serving the request
   */
  readonly bunify: Bunify
  /**
   * The route this request was made from
   */
  readonly route: RequestRoute

  readonly traceId?: string
  readonly requestId: string | number
  readonly log: Logger | undefined

  get clientIp() {
    return this._clientIp
  }

  get clientPort() {
    return this._clientPort
  }

  get clientIpFamily() {
    return this._clientIpFamily
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


  constructor(bunify: Bunify, request: BunRequest, route: RequestRoute) {
    this.bunify = bunify
    this.route = route
    this._request = request

    this.requestId = this.getRequestId()
    this.traceId = this.getTraceId()

    this.getRequestIp()

    if (bunify.requestOptions?.logEcsFields) {
      this.log = bunify.log?.getChild("request").with({
        http: {
          request: {
            id: this.requestId,
            method: this._request.method
          }
        },
        url: {
          path: this._request.url
        }
      })

      if (bunify.requestOptions.traceIdHeader) {
        this.log = this.log?.with({
          id: this.traceId
        })
      }
    } else {
      this.log = bunify.log?.getChild("Request").with({
        reqId: this.requestId,
        traceId: this.traceId ?? undefined
      })


      if (bunify.requestOptions?.traceIdHeader) {
        this.log = this.log?.with({ traceId: this.traceId })
      }
    }
  }

  /**
   * Extract the request id from the header
   */
  private getRequestId(): string | number {
    if (this.bunify.requestOptions?.genReqId)
      return (this.bunify.requestOptions.genReqId as (request: BunRequest) => string | number)(this._request)

    throw BUNIFY_ERR_REQUEST_INVALID_REQID_HANDLER
  }

  /**
   * Extract the trace identifier from the header (if configured)
   */
  private getTraceId(): string | undefined {
    if (this.bunify.requestOptions?.traceIdHeader) {
      return this._request.headers.get(this.bunify.requestOptions?.traceIdHeader) ?? undefined
    }
  }

  /**
   * Retrieve the request id.
   * A placeholder for a future proxy handler
   */
  private getRequestIp() {
    if ((this.bunify as any)._server) {
      const clientSocket = ((this.bunify as any)._server as Bun.Server<any>).requestIP(this._request)
      this._clientIp = clientSocket?.address
      this._clientPort = clientSocket?.port
      this._clientIpFamily = clientSocket?.family

      return clientSocket
    }
  }
}
