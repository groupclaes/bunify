import { configure, getConsoleSink, getJsonLinesFormatter, getLogger, type Logger } from '@logtape/logtape';
import type { BunRequest } from 'bun';


import {
  BUNIFY_ERR_ALREADY_RUNNING,
  BUNIFY_ERR_DESC_HOOK_NOT_FOUND,
  BUNIFY_ERR_DESC_ROUTE_EXISTS,
  BUNIFY_ERR_DESC_ROUTE_MUST_START_WITH_SLASH,
  BUNIFY_ERR_NOT_RUNNING,
  BunifyError
} from './errors';

import { EnvUtils } from './utils/environment';
import type { BunifyOptions, BunifyRequestOptions } from './options'
import { ENV_PORTS_POSSIBLE,  } from './options'
import { type _RequestRoute, type RequestHandler, type RequestHandlerFunction, type RequestHook, type RequestRoute } from './models/request-route';

import { defaultErrorHandlerFactory } from './errors/error-handler';
import { BUNIFY_DEFAULT_REQUEST_ID_HEADER, defaultRequestIdGeneratorFactory } from './utils/request-id';
import type { BunifyHook } from './models/application-hooks';

import { BunifyResponse } from './response';
import { BunifyRequest, RequestLifecycle } from './request';
import { catchResponseOrContinue, executeRequestAndRouteHook } from './request-pipeline';
import { registerBunifyModuleCorrectly, type BunifyModuleOptions, type BunifyModuleRegistrator } from './bunify-module';



export interface BunifyInstance {
  /**
   * Bunify server listen port
   * @returns The current server's configured port when running, falls back to configured port
   */
  get port(): number
  /**
   * Returns the listening hostname/ip
   */
  get hostname(): string
  /**
   * Returns the LogTape logger if logging is enabled
   * 
   * @optional
   */
  get log(): Logger | undefined
  /**
   * Server running status
   */
  get running(): boolean
  /**
   * Configuration options for requests
   */
  get requestOptions(): BunifyRequestOptions | undefined

  /**
   * Apply one or more request hook functions to the hooks lifecycle
   * @param hook hook name
   * @param handler Handler(s) to execute
   */
  addHook(hook: RequestLifecycle, handler: RequestHook | RequestHook[]): BunifyInstance;
  /**
   * Apply one or more hook functions to this Bunify instance
   * 
   * @param hook 
   * @param handler 
   */
  addHook(hook: BunifyLifecycle, handler: BunifyHook | BunifyHook[]): BunifyInstance;

  /**
   * Register a new GET-route
   * 
   * @param url Path to route, parameters are allowed
   * @param handler Function to execute after the preHandler hook
   */
  get(url: string, handler: RequestHandler): BunifyInstance
  /**
   * Register a new PUT-route
   * 
   * @param url Path to route, parameters are allowed
   * @param handler Function to execute after the preHandler hook
   */
  put(url: string, handler: RequestHandler): BunifyInstance
  /**
   * Register a new POST-route
   * 
   * @param url Path to route, parameters are allowed
   * @param handler Function to execute after the preHandler hook
   */
  post(url: string, handler: RequestHandler): BunifyInstance
  /**
   * Register a new PATCH-route
   * 
   * @param url Path to route, parameters are allowed
   * @param handler Function to execute after the preHandler hook
   */
  patch(url: string, handler: RequestHandler): BunifyInstance
  /**
   * Register a new DELETE-route
   * 
   * @param url Path to route, parameters are allowed
   * @param handler Function to execute after the preHandler hook
   */
  delete(url: string, handler: RequestHandler): BunifyInstance
  /**
   * Register a new HEAD-route
   * 
   * @param url Path to route, parameters are allowed
   * @param handler Function to execute after the preHandler hook
   */
  head(url: string, handler: RequestHandler): BunifyInstance
  /**
   * Register a new TRACE-route
   * 
   * @param url Path to route, parameters are allowed
   * @param handler Function to execute after the preHandler hook
   */
  trace(url: string, handler: RequestHandler): BunifyInstance


  /**
   * Register a route with configuration
   * 
   * @param route 
   * @param override Override any existing route, and reload the server if running
   */
  addRoute(route: RequestRoute, override?: boolean): BunifyInstance
}

export enum BunifyLifecycle {
  OnReady = 'onReady',
  OnListen = 'onListen',
  OnReload = 'onReload',
  OnClose = 'onClose',
  PreClose = 'preClose',
  OnRoute = 'onRoute',
  OnRegister = 'onRegister'
}

function loggerFactory(logOptions?: boolean): Logger | undefined {
  if (logOptions) {
    if (logOptions === true) {
      return getLogger([""])
    }
  }
}

/**
 * Fastify functionality with Bun performance
 */
export class Bunify implements BunifyInstance {
  private readonly _baseLogger?: Logger
  private readonly _options: BunifyOptions
  private readonly _routes: Record<string, _RequestRoute>  = {}
  private readonly _hooks: Record<BunifyLifecycle | RequestLifecycle, BunifyHook[] | RequestHook[]> = {
    // Application hooks
    onReady: [],
    onReload: [],
    onRegister: [],
    onRoute: [],
    preClose: [],
    onListen: [],
    onClose: [],

    // Request hooks
    onRequest: [],
    preParsing: [],
    preValidation: [],
    preHandler: [],
    preSerialization: [],
    onSend: [],
    onResponse: [],
    onRequestAbort: [],
    onError: [],
    onTimeout: [],
  }

  protected _server?: Bun.Server<any>
  private _logger?: Logger

  private _errorHandler?: (error: Bun.ErrorLike) => BunifyResponse | Promise<BunifyResponse> | void | Promise<void>

  get port() {
    return this._server?.port ?? this.getPort()
  }

  get hostname() {
    return this._server?.hostname ?? this.getListenHostname()
  }

  get log() {
    return this._logger
  }

  get running() {
    return this._server != null
  }

  get requestOptions() {
    return this._options.request
  }

  set errorHandler(value: (error: Bun.ErrorLike) => BunifyResponse | Promise<BunifyResponse> | void | Promise<void>) {
    this._errorHandler = value
  }

  constructor(options: BunifyOptions) {
    this._options = options

    // Setup request options
    if (!options.request) {
      options.request = {}
    }

    if (options.request.idHeader == null || options.request.idHeader === true) {
      options.request.idHeader = BUNIFY_DEFAULT_REQUEST_ID_HEADER
    }

    // Ignore logging if set to false
    if (options.request.genReqId !== false) {
      if (!options.request.genReqId) {
        // Use the factory if configured
        if (options.request.genReqIdFactory) {
          options.request.genReqId = options.request.genReqIdFactory(this)
        } else {
          // Fall back to the default request id factory
          options.request.genReqId = defaultRequestIdGeneratorFactory(this)
        }
      } else {
        // genReqId is true, use default generator
        options.request.genReqId = defaultRequestIdGeneratorFactory(this)
      }
    }

    // Setup logging
    if (typeof options.log === 'object') {
      configure(options.log)
    } else if (options.log !== false) {
      configure({
        sinks: {
          console: getConsoleSink({
            formatter: getJsonLinesFormatter()
          })
        },
        loggers: [
          {
            category: "@groupclaes/bunify",
            lowestLevel: "info",
            sinks: ["console"],
          },
          {
            category: ["logtape", "meta"],
            lowestLevel: "warning",
            sinks: ["console"],
          },
        ],
      })
    }

    this._baseLogger = options.log ? getLogger([ "@groupclaes/bunify" ]) : undefined
    this._logger = this._baseLogger?.getChild('Bunify')
  }

  /**
   * Start the Bunify server
   * 
   * @throws {BunifyError} if the server is already running
   * @param hostname Override the configuration's listen addresses
   * @param port Override the configuration's listen port
   */
  async listen(hostname?: string, port?: number): Promise<Bunify> {
    if (this._server != null) {
      throw BUNIFY_ERR_ALREADY_RUNNING
    }

    hostname = this.getListenHostname(hostname)
    port = this.getPort(port)
    const hasTls = this._options.tls != null && (!Array.isArray(this._options.tls) || this._options.tls.length > 0)
    
    await this.executeBunifyHook(BunifyLifecycle.OnReady)

    if (!this._options.silent)
      this._logger?.info(`Starting Bunify server`,
        { service: { address: `http${hasTls ? 's': ''}://${hostname}:${port}` } })
    this._server = Bun.serve(this.getServerSettings(hostname, port))
    
    await this.executeBunifyHook(BunifyLifecycle.OnListen)

    if (this._baseLogger) {
      this._logger = this._baseLogger?.getChild('Bunify')
        .with({ service: { ephemeral_id: this._server.id } })
    }
  
    if (!this._options.silent)
      this._logger?.info(`Started Bunify server`,
        { service: { address: this._server.url }})

    return this
  }

  /**
   * Reload the Bunify server, applying the new routes
   * @throws {BunifyError} if server hasn't been started yet
   */
  async reload(): Promise<Bunify> {
    if (this._server == null)
      throw BUNIFY_ERR_NOT_RUNNING

    if (!this._options.silent)
      this._logger?.info(`Reloading Bunify server`,
        { service: { address: this._server.url }})

    this._server.reload(this.getServerSettings(this._server.hostname, this._server.port))

    await this.executeBunifyHook(BunifyLifecycle.OnReload)

    return this
  }

  /**
   * Stop the the Bunify server
   * 
   * @param kill Should the server be terminated, aborting all in-flight request
   * @throws {BunifyError} if server hasn't been started yet
   */
  async stop(kill: boolean = false): Promise<Bunify> {
    if (this._server == null)
      throw BUNIFY_ERR_NOT_RUNNING

    await this.executeBunifyHook(BunifyLifecycle.PreClose)
    if (!this._options.silent)
      this._logger?.debug(`${kill ? 'Killing' : 'Stopping'} HTTP server ${this._server?.id ?? 'NO-ID'}`)

    await this._server?.stop(kill)

    if (!this._options.silent)
      this._logger?.debug(`${kill ? 'Killed' : 'Stopped'} HTTP server ${this._server?.id ?? 'NO-ID'}`)
    await this.executeBunifyHook(BunifyLifecycle.OnClose)

    // Remove server instance
    this._server = undefined
    this._logger = this._baseLogger

    return this
  }

  /**
   * Register an extension
   */
  register(moduleRegistrator: BunifyModuleRegistrator, options?: BunifyModuleOptions): Bunify {
    return registerBunifyModuleCorrectly(this, moduleRegistrator, options)
  }

  /**
   * 
   */
  use(): Bunify {
    throw new BunifyError('Not implemented yet')

    return this
  }

/**
 * Interopability with the Fastify structure, except you can chain route functions
*/


  get(url: string, handler: RequestHandlerFunction): Bunify {
    return this.addRoute({ url, handler, method: 'GET' })
  }
  put(url: string, handler: RequestHandlerFunction): Bunify {
    return this.addRoute({ url, handler, method: 'PUT' })
  }
  post(url: string, handler: RequestHandlerFunction): Bunify {
    return this.addRoute({ url, handler, method: 'POST' })
  }
  patch(url: string, handler: RequestHandlerFunction): Bunify {
    return this.addRoute({ url, handler, method: 'PATCH' })
  }
  delete(url: string, handler: RequestHandlerFunction): Bunify  {
    return this.addRoute({ url, handler, method: 'DELETE' })
  }
  head(url: string, handler: RequestHandlerFunction): Bunify  {
    return this.addRoute({ url, handler, method: 'HEAD' })
  }
  trace(url: string, handler: RequestHandlerFunction): Bunify  {
    return this.addRoute({ url, handler, method: 'TRACE' })
  }

  /**
   * Register a route with configuration
   * 
   * @param route 
   * @param override Override any existing route, and reload the server if running
   */
  addRoute(route: RequestRoute, override?: boolean): Bunify {
    if (!route.url.startsWith('/')) {
      throw BUNIFY_ERR_DESC_ROUTE_MUST_START_WITH_SLASH
    }

    const configuredRoute = this._routes[route.url]
    if (!override && configuredRoute) {
      throw BUNIFY_ERR_DESC_ROUTE_EXISTS
    }

    this._routes[route.url] = {
      internalHandler: (bunRequest: BunRequest) => this.handleRequest(bunRequest, route),
      ...route
    }
    this.executeBunifyHook(BunifyLifecycle.OnRoute, route)

    if (this._server != null)
      this.reload()

    return this
  }

  addHook(hook: BunifyLifecycle | RequestLifecycle, handler: BunifyHook | BunifyHook[] | RequestHook | RequestHook[]): Bunify {
    if (!this._hooks[hook]) {
      throw BUNIFY_ERR_DESC_HOOK_NOT_FOUND
    }

    /* @ts-ignore */
    Array.isArray(handler) ? this._hooks[hook].push(...handler) : this._hooks[hook].push(handler)

    return this
  }

  /**
   * Parse the correct port and override configuration if need be.
   * 
   * @private
   * @param overridePort 
   * @returns 
   */
  private getPort(overridePort?: number): number {
    if (overridePort && overridePort > 0 && overridePort < 65535) {
      return overridePort
    }

    for (const envPort of ENV_PORTS_POSSIBLE) {
      if (process.env[envPort] && process.env[envPort].length > 0) {
        const envPortValue = +process.env[envPort]
        if (!isNaN(envPortValue) && envPortValue > -1 && envPortValue < 65536) {
          return envPortValue !== 0 ? envPortValue : 3000
        }
      }
    }

    // Port validations are done in the ConfigurationValidator
    return this._options.port && this._options.port !== 0
      ? this._options.port : 3000
  }

  /**
   * Return the configured hostname to listen on
   * 
   * @param overrideIp Override with an ip if it's valid
   * @returns 
   */
  private getListenHostname(overrideIp?: string): string {
    if (overrideIp && overrideIp.length > 0) {
      return overrideIp
    }

    if (process.env.BUNIFY_HOST && process.env.BUNIFY_HOST.length > 0) {
      return process.env.BUNIFY_HOST
    }

    return this._options.hostname ?? "0.0.0.0"
  }

  private getServerSettings(hostname?: string, port?: number): Bun.Serve.Options<any, never> {
    const serveDevelopment = this._options.development
      ?? EnvUtils.envEquals([ 'BUN_ENV', 'NODE_ENV' ], "development")
      ?? false

    return {
      id: this._server?.id ?? Bun.randomUUIDv7(),
      port,
      hostname,
      ipv6Only: this._options.ipv6Only ?? false,
      development: serveDevelopment,
      tls: this._options.tls,
      routes: this.parseRoutes(),
      // Order: Custom error handler, development page (if enabled), default error handler
      error: this._errorHandler ?? !serveDevelopment ? defaultErrorHandlerFactory(this) : undefined
    } satisfies Bun.Serve.Options<any, never>
  }

  private async executeBunifyHook(hook: BunifyLifecycle, ...args: Array<any>) {
    for (const bunifyHook of this._hooks[hook] as BunifyHook[]) {
      const result = bunifyHook(this, args)
      if (result && typeof result.then === "function") {
        await result
      }
    }
  }

  private async executeRequestAndRouteHook(hook: RequestLifecycle, request: BunifyRequest, response: BunifyResponse) {
    if (this._hooks[hook].length === 0 && request.route.hooks && request.route.hooks[hook]?.length === 0) return

    let result = await executeRequestAndRouteHook(this._hooks[hook] as RequestHook[],
      request.route.hooks ? request.route.hooks[hook] : undefined,
      request, response)
    if (result instanceof Response) return result

    if (!response.ok) {
      // An error statusCode has been set, jump to preSerialization
      return await this.finalizeRequest(request, response)
    }
  }

  private async finalizeRequest(bunifyRequest: BunifyRequest, bunifyResponse: BunifyResponse, handlerResult?: Response): Promise<Response> {
    let result = await this.executeRequestAndRouteHook(RequestLifecycle.PreSerialization, bunifyRequest, bunifyResponse)
    if (result instanceof Response) return result

    // TODO - Serialize the response

    result = await this.executeRequestAndRouteHook(RequestLifecycle.OnSend, bunifyRequest, bunifyResponse)
    if (result instanceof Response) return result

    // Execute onResponse hook functions without waiting
    this.executeRequestAndRouteHook(RequestLifecycle.OnResponse, bunifyRequest, bunifyResponse)

    // Hmm
    return result ?? handlerResult ?? bunifyResponse.send()
  }

  private async handleRequest(request: BunRequest, route: RequestRoute): Promise<Response> {
    const bunifyRequest = new BunifyRequest(this, request, route)
    const bunifyResponse = new BunifyResponse(bunifyRequest)
  
    // Set the timeout for the request to the route timeout, or the default timeout, if neither is set, fallback to no timeout
    const timeout = route.timeout ?? this.requestOptions?.defaultTimeout ?? 0
    if (timeout > 0)
      this._server?.timeout(request, timeout)


    let result = await this.executeRequestAndRouteHook(RequestLifecycle.OnRequest, bunifyRequest, bunifyResponse)
    if (result instanceof Response) return result

    result = await this.executeRequestAndRouteHook(RequestLifecycle.PreParsing, bunifyRequest, bunifyResponse)
    if (result instanceof Response) return result
    
    // TODO - Parse the body

    result = await this.executeRequestAndRouteHook(RequestLifecycle.PreValidation, bunifyRequest, bunifyResponse)
    if (result instanceof Response) return result

    // TODO: Implement validation

    result = await this.executeRequestAndRouteHook(RequestLifecycle.PreHandler, bunifyRequest, bunifyResponse)
    if (result instanceof Response) return result

    // Execute the request itself 
    let handlerResult = await catchResponseOrContinue(route.handler(bunifyRequest, bunifyResponse), bunifyResponse)


    return await this.finalizeRequest(bunifyRequest, bunifyResponse, handlerResult)
  }

  /**
   * Convert the Bunify routes to a valid simplistic Bun.serve route
   * 
   * @returns 
   */
  private parseRoutes() {
    const routes = {} as any

    for (const [route, requestRoute] of Object.entries(this._routes)) {
      routes[route] = requestRoute.internalHandler
    }

    return routes
  }
}
