import type { Bunify, BunifyInstance, BunifyLifecycle } from "./bunify"
import type { BunifyHook, RequestRoute } from "./models"
import { BUNIFY_ERR_DESC_ROUTE_MUST_START_WITH_SLASH, BUNIFY_ERR_MODULE_PREFIX_MUST_START_WITH_SLASH } from "./errors"
import type { _RequestRoute, RequestHook } from "./models/request-route"
import type { RequestLifecycle } from "./request"

export interface BunifyModuleOptions {
  prefix?: string
  logLevel?: string

  [key: string]: any
}

export type BunifyModuleRegistrator = (bunify: BunifyInstance, options?: BunifyModuleOptions) => void

export function registerBunifyModuleCorrectly(bunify: Bunify, registrator: BunifyModuleRegistrator, options?: BunifyModuleOptions) {
  // Validate the options first
  if (options?.prefix && !options.prefix.startsWith('/')) {
    throw BUNIFY_ERR_MODULE_PREFIX_MUST_START_WITH_SLASH
  }



  const bunifyInstance = Object.assign({}, bunify, {

    prefix: options?.prefix,
    requestOptions: bunify.requestOptions,
    addRoute(route: RequestRoute, override?: boolean) {
      if (!route.url.startsWith('/')) {
        throw BUNIFY_ERR_DESC_ROUTE_MUST_START_WITH_SLASH
      }

      const internalRoute = Object.assign({}, route) as _RequestRoute

      if (options) {
        if (options.prefix) {
          internalRoute.url = `${options.prefix}${route.url}`
        }

        internalRoute.logLevel = options?.logLevel
      }

      bunify.addRoute(internalRoute, override)

      return bunifyInstance
    },
    addHook(hook: BunifyLifecycle | RequestLifecycle, handler: BunifyHook | BunifyHook[] | RequestHook | RequestHook[]) {
      bunify.addHook(hook, handler)

      return bunifyInstance
    }
  }) as BunifyInstance


  registrator(bunifyInstance, options)

  return bunify
}
