import type { BunRequest } from "bun";
import type { Bunify } from "../bunify";

export const BUNIFY_DEFAULT_REQUEST_ID_HEADER = 'request-id'

export type BunifyRequestIdFactory = (bunify: Bunify) =>
  (request: BunRequest) => string | number

/**
 * The default incremental integer-based request-id generator
 * Tries to read the idHeader first, if configured.
 * 
 * @param bunify 
 * @returns 
 */
export function defaultRequestIdGeneratorFactory(bunify: Bunify): (request: BunRequest) => string | number {
  (bunify as any)._next_request_id = 1
  
  if (bunify.requestOptions?.idHeader === false) {
    return (_: BunRequest) => (bunify as any)._next_request_id++
  }

  return (request: BunRequest) => {
    const requestIdHeader = request.headers.get(bunify.requestOptions?.idHeader as string)
    if (requestIdHeader)
      return requestIdHeader

    return (bunify as any)._next_request_id++
  }
}

/**
 * A UUID-based request-id generator
 * Useful for distributed systems and/or microsystems
 * 
 * @param bunify 
 * @returns 
 */
export function requestUUIDGeneratorFactory(bunify: Bunify): (request: BunRequest) => string | number {

  if (bunify.requestOptions?.idHeader === false) {
    return (_: BunRequest) => Bun.randomUUIDv7()
  }

  return (request: BunRequest) => {
    const requestIdHeader = request.headers.get(bunify.requestOptions?.idHeader as string)
    if (requestIdHeader)
      return requestIdHeader

    return Bun.randomUUIDv7()
  }
}