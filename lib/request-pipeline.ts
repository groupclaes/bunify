import { BUNIFY_ERR_REQUEST_HOOK_RETURNS_RESPONSE, BUNIFY_ERR_RESPONSE_DOESNT_MATCH } from "./errors"
import type {
  RequestHandlerFunctionResult,
  RequestHook,
  RequestHookOrHandler,
  RequestHookResult
} from "./models/request-route"
import type { BunifyRequest } from "./request"
import { BunifyResponse } from "./response"
import { isObject, isPromiseLike } from "./utils/generic"

/**
 * Validate the received response to the initially created response, and parse to a plain response for bun
 * 
 * @param response received response from the hook
 * @param requestResponse 
 */
export function parseBunifyResponse(requestResponse: BunifyResponse,
  response?: Response | BunifyResponse): Response | undefined {
  if (!response) {
    return
  }

  if (response instanceof BunifyResponse) {
    if (response !== requestResponse)
      throw BUNIFY_ERR_RESPONSE_DOESNT_MATCH

    return response.send()
  } else {
    // TODO - Update the requestResponse with the contents of the returned plain Response object
    requestResponse.code(response.status)
    requestResponse.statusText = response.statusText
  }

  return response
}

export async function catchResponseOrContinue(handleResult: RequestHookResult | RequestHandlerFunctionResult,
  bunifyResponse: BunifyResponse): Promise<Response | undefined> {
  let resultResponse: BunifyResponse | Response | undefined

  if (isPromiseLike(handleResult)) {
    const promiseResult = await handleResult
    if (isObject(promiseResult)) {
      /* @ts-ignore */
      // The check above does
      resultResponse = promiseResult
    }
  } else if (isObject(handleResult)) {
    resultResponse = handleResult as BunifyResponse | Response
  }

  resultResponse = parseBunifyResponse(bunifyResponse, resultResponse)
  if (resultResponse)
    return resultResponse

  // Don't return anything otherwise
}

export async function executeRequestHook(requestHookInput: RequestHook | RequestHook[],
  request: BunifyRequest, bunifyResponse: BunifyResponse): Promise<Response | void> {

  let resultResponse: BunifyResponse | Response | undefined | void

  //
  for (const requestHook of Array.isArray(requestHookInput) ? requestHookInput : [ requestHookInput ]) {
    if (typeof requestHook === 'function') {
      resultResponse = await catchResponseOrContinue(requestHook(request, bunifyResponse), bunifyResponse)
      if (resultResponse instanceof Response)
        return resultResponse
    } else {
      // TODO - Check this when registering the hook, to prevent runtime errors
      throw BUNIFY_ERR_REQUEST_HOOK_RETURNS_RESPONSE
    }
  }
}

export async function executeRequestAndRouteHook(requestHook: RequestHook | RequestHook[],
  routeHook: RequestHook | RequestHook[] | undefined, bunifyRequest: BunifyRequest,
  bunifyResponse: BunifyResponse): Promise<Response | void> {
  
  let result = await executeRequestHook(requestHook, bunifyRequest, bunifyResponse)
  if (result instanceof Response) return result

  // Route hook as last
  if (routeHook) {
    result = await executeRequestHook(routeHook, bunifyRequest, bunifyResponse)
    if (result instanceof Response) return result
  }
}
