import type { BodyInit } from "bun";
import type { Bunify } from "./bunify";
import { isValidRedirectStatusCode, validateRedirectStatusCode, validateStatusCode } from "./utils/status-code";
import type { BunifyRequest } from "./request";

export interface BunifyResponseInit extends ResponseInit {
  readonly url: string
  headers?: Bun.__internal.BunHeadersOverride
}

export class BunifyResponse {
  private readonly _bunify: Bunify
  private _startTime: number
  private _sentTime?: number

  private _statusCode = 200
  private _statusText = 'OK'
  private _ok: boolean = true
  private _sent: boolean = false
  private _body?: BodyInit

  private _request: BunifyRequest
  
  readonly headers: Headers

  get statusCode() {
    return this._statusCode
  }

  set statusCode(value: number) {
    this.code(value)
  }

  get statusText() {
    return this._statusText
  }

  set statusText(value: string) {
    this._statusText = value
  }

  /**
   * Check if the response status is ok vs in error
   */
  get ok() {
    return this._ok
  }

  get url() {
    return this._request.url
  }

  /**
   * Check if the request has already been sent
   */
  get sent() {
    return this._sent
  }

  /**
   * Get the elapsed time in nanoseconds since the request was received
   * Returns the total request time if the request has already been sent.
   */
  get elapsedTime() {
    return (this._sentTime ?? Bun.nanoseconds()) - this._startTime
  }


  constructor(bunifyRequest: BunifyRequest, init?: BunifyResponseInit) {
    this._request = bunifyRequest
    this._bunify = bunifyRequest.bunify
    this._startTime = Bun.nanoseconds()

    if (init) {
      this.code(init.status ?? 200)
      this._statusText = init.statusText ?? 'OK'
    }

    this.headers = init?.headers ?? new Headers() 
  }

  /**
   * Set the HTTP status code for the response
   * 
   * @param statusCode A valid HTTP statuscode to configure
   * @throws {BunifyResponseError} if statusCode is invalid
   */
  code(statusCode: number) {
    validateStatusCode(statusCode)
    this._statusCode = statusCode

    this._ok = statusCode < 400
  }

  /**
   * Add or update a header's value
   * 
   * @param key Header name
   * @param value The header's value must be properly encoded using encodeURI or similar modules such as encodeurl.
   */
  header(key: string, value: string) {
    this.headers.set(key, value)
  }
  /**
   * Retrieve an existing header
   * 
   * @param key Get a header by it's key
   * @returns header value, or null if not found
   */
  getHeader(key: string) {
    return this.headers.get(key)
  }
  /**
   * Get all headers as a plain JS object
   * 
   * @returns Key-value object of the headers
   */
  getHeaders() {
    return this.headers.toJSON()
  }
  /**
   * Remove a header from the headers list
   * 
   * @param key Header name to remove
   */
  removeHeader(key: string) {
    this.headers.delete(key)
  }

  /**
   * Check if the response contains the header
   * 
   * @param key 
   * @returns true if the header exists
   */
  hasHeader(key: string) {
    return this.headers.has(key)
  }

  type(contentType: string) {
    contentType = contentType.toLowerCase().trim()

    if (contentType === 'application/json')
      contentType += ';charset=utf-8'
  
    this.headers.set('content-type', contentType)
  }


  /**
   * Redirect the client to a new url
   * 
   * @param url 
   * @param statusCode Must be a valid 3xx HTTP statuscode
   * @throws {BunifyResponseError} if the statuscode is invalid
   * @returns 
   */
  redirect(url: string, statusCode?: number): Response;
  /**
   * Redirect the client to with a response init to append to the response.
   * This will set the BunifyResponse statuscode and statustext if set
   * 
   * @param url 
   * @param responseInit 
   */
  redirect(url: string, responseInit: ResponseInit): Response;
  redirect(url: string, codeOrResponseInit?: number | ResponseInit): Response {
    if (codeOrResponseInit) {
      if (isNaN(+codeOrResponseInit)) {
        const responseInit = codeOrResponseInit as ResponseInit

        if (responseInit.status)
          this._statusCode = responseInit.status
        if (responseInit.statusText)
          this._statusText = responseInit.statusText

        this.markAsSent()
        return Response.redirect(url, codeOrResponseInit as ResponseInit)
      } else {
        validateRedirectStatusCode(codeOrResponseInit as number)
        this._statusCode = codeOrResponseInit as number
      }
    }

    this.markAsSent()
    return Response.redirect(url, isValidRedirectStatusCode(this._statusCode) ? this._statusCode : 302)
  }

  /** */




  /**
   * Send the response
   * 
   * @param data 
   * @returns 
   */
  send(data?: BodyInit | Response): Response {
    if (data instanceof Response) {
      this._statusCode = data.status,
      this._statusText = data.statusText

      return data
    } else {
      this._body = data
    }

    return new Response(data, {
      status: this._statusCode,
      statusText: this._statusText,
      headers: this.headers
    })
  }

  private markAsSent() {
    this._sent = true
    this._sentTime = Bun.nanoseconds()
  }
}