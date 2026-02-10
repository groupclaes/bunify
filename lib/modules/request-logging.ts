import type { BunifyInstance } from "../bunify";
import type { BunifyModuleOptions } from "../bunify-module";
import { BunifyRequest, RequestLifecycle } from "../request";
import type { BunifyResponse } from "../response";

export function registerRequestLogger(bunify: BunifyInstance, options?: BunifyModuleOptions) {
  if (bunify.requestOptions?.logEcsFields) {
    registerEcsRequestHooks(bunify)
  } else {
    registerRequestHooks(bunify)
  }
}

function registerEcsRequestHooks(bunify: BunifyInstance) {
  bunify.addHook(RequestLifecycle.OnRequest,
    (request: BunifyRequest) =>
        request.log?.info('Received client request!', {
            http: { 
              mime_type: request.headers.get('content-type'),
              body: {
                bytes: request.headers.get('content-length')
              }
            },
            client: request.bunify.requestOptions?.logIp ? {
              address: request.clientIp,
              ip: request.clientIp,
              port: request.clientPort
            } : undefined
          }))


  bunify.addHook(RequestLifecycle.OnResponse,
    (_: BunifyRequest, response: BunifyResponse) =>
      response.log?.info('Sent response to the client!', {
        http: { 
          mime_type: response.headers.get('content-type') ?? undefined,
          body: {
            bytes: response.headers.get('content-length') ?? 0
          }
        }
      }))
}

function registerRequestHooks(bunify: BunifyInstance) {
   bunify.addHook(RequestLifecycle.OnRequest,
    (request: BunifyRequest) =>
      request.log?.info ('There\'s cheese under my foreskin!'))
}
