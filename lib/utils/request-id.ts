import type { BunRequest } from "bun";
import type { Bunify } from "../bunify";

export const BUNIFY_DEFAULT_REQUEST_ID_HEADER = 'request-id'

/**
 * Id-based
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