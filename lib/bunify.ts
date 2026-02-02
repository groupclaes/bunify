import { EnvUtils } from './utils/environment';
import pino from 'pino'
import type { BunifyOptions } from './options'
import { BunifyOptionsValidator, ENV_PORTS_POSSIBLE } from './options'
import { BunifyError } from './errors/bunify-error';
import type { BunifyRequest } from './request';
import type { BunifyResponse } from './response';

export interface BunifyInstance {

}

/**
 * Fastify functionality with Bun performance
 */
export class Bunify implements BunifyInstance {
  private readonly _baseLogger: pino.Logger
  private readonly _options: BunifyOptions
  protected _server?: Bun.Server<any>
  private _pino: pino.Logger

  private _errorHandler?: (error: Bun.ErrorLike) => BunifyResponse | Promise<BunifyResponse> | void | Promise<void>
  private _genReqId?: (request: BunifyRequest) => number | string

  get port() {
    return this._server?.port ?? this.getPort()
  }

  get hostname() {
    return this._server?.hostname ?? this.getListenHostname()
  }

  get log() {
    return this._pino
  }

  get running() {
    return this._server != null
  }

  set errorHandler(value: (error: Bun.ErrorLike) => Response | Promise<Response> | void | Promise<void>) {
    this._errorHandler = value
  }

  /**
   * 
   * @param options 
   */
  constructor(options: BunifyOptions) {
    // Throws if there's a misconfiguration
    this._options = options

    this._baseLogger = pino(options.log)
    this._pino = this._baseLogger
  }

  /**
   * Start the Bunify server
   * 
   * @throws {BunifyError} if the server is already running
   * @param hostname Override the configuration's listen addresses
   * @param port Override the configuration's listen port
   */
  listen(hostname?: string, port?: number): Bunify {
    if (this._server != null) {
      throw new BunifyError('Server is already running, reload stop or reload the process');
    }

    hostname = this.getListenHostname(hostname)
    port = this.getPort(port)
    const hasTls = this._options.tls != null && (!Array.isArray(this._options.tls) || this._options.tls.length > 0)

    if (!this._options.silent)
      this._pino.info({ service: { address: `http${hasTls ? 's': ''}://${hostname}:${port}` }}, `Starting Bunify server`)
    this._server = Bun.serve(this.getServerSettings(hostname, port))
    this._pino = this._baseLogger.child({ service: { ephemeral_id: this._server.id } })
    if (!this._options.silent)
      this._pino.info({ service: { address: this._server.url }}, `Started Bunify server`)

    return this
  }

  /**
   * Reload the Bunify server, applying the new routes
   * @throws {BunifyError} if server hasn't been started yet
   */
  reload(): Bunify {
    if (this._server == null)
      throw new BunifyError('Server isn\'t running!')

    if (!this._options.silent)
      this._pino.info({ service: { address: this._server.url }},  `Starting Bunify server`)

    this._server.reload(this.getServerSettings(this._server.hostname, this._server.port))

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
      throw new BunifyError('Server isn\'t running!')

    if (!this._options.silent) this._pino.info(`${kill ? 'Killing' : 'Stopping'} HTTP server ${this._server?.id ?? 'NO-ID'}`)
    await this._server?.stop(kill)

    // Remove server instance
    this._server = undefined
    this._pino = this._baseLogger

    return this
  }

  /**
   * Register an extension
   */
  register(): Bunify {
    throw new BunifyError('Not implemented yet')

    return this
  }

  /**
   * 
   */
  use(): Bunify {
    throw new BunifyError('Not implemented yet')

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
    const serveDevelopment = this._options.development ?? EnvUtils.envEquals([ 'BUN_ENV', 'NODE_ENV' ], "development") ?? false

    return {
      id: this._server?.id ?? Bun.randomUUIDv7(),
      port,
      hostname,
      ipv6Only: this._options.ipv6Only ?? false,
      development: serveDevelopment,
      tls: this._options.tls,
      routes: [

      ],
      // Order: Custom error handler, development page (if enabled), default error handler
      error: this._errorHandler ?? !serveDevelopment ? this.defaultErrorHandler : undefined
    } satisfies Bun.Serve.Options<any, never>
  }

  private defaultErrorHandler(error: Bun.ErrorLike) {
    this._pino.error({ err: error }, 'An unhandled exception occured!')
    return Response.json({
      code: 500,
      status: "An unhandled exception occured!"
    }, { status: 500, statusText: 'An unhandled exception occured!' })
  }
}
