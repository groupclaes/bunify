import { EnvUtils } from './utils/environment';
import pino from 'pino'
import type { BunifyOptions } from './options'
import { BunifyOptionsValidator, ENV_PORTS_POSSIBLE } from './options'

/**
 * Fastify functionality with Bun performance
 */
export class Bunify {
  private readonly _pino: pino.BaseLogger
  private readonly _options: BunifyOptions
  private _server?: Bun.Server<any>

  get port() {
    return this._server?.port ?? this.getPort()
  }

  get hostname() {
    return this._server?.hostname ?? this.getListenHostname()
  }

  get log() {
    return this._pino
  }

  /**
   * 
   * @param options 
   */
  constructor(options: BunifyOptions) {
    // Throws if there's a misconfiguration
    BunifyOptionsValidator.validate(options)

    this._options = options
    this._pino = pino(options.log)
  }

  /**
   * Start the Bun server
   * 
   * @param hostname Override the configuration's listen addresses
   * @param port Override the configuration's listen port
   */
  listen(hostname?: string, port?: number) {
    hostname = this.getListenHostname(hostname)
    port = this.getPort(port)

    const serveDevelopment = this._options.development ?? EnvUtils.envEquals([ 'BUN_ENV', 'NODE_ENV' ], "development") ?? false
    const hasTls = this._options.tls != null && (!Array.isArray(this._options.tls) || this._options.tls.length > 0)

    if (!this._options.silent) this._pino.info({ service: { address: `http${hasTls ? 's': ''}://${hostname}:${port}` }},  `Starting Bunify server`)
    this._server = Bun.serve({
      port,
      hostname,
      ipv6Only: this._options.ipv6Only ?? false,
      development: serveDevelopment,
      tls: this._options.tls,
      

      websocket: {} as any,
      fetch(req) {

      }
    })
    if (!this._options.silent) this._pino.info({ service: { address: `http${hasTls ? 's': ''}://${this.hostname}:${this.port}` }},  `Started Bunify server`)
  }

  /**
   * Stop the the Bun server
   * 
   * @param kill Should the server be terminated, aborting all in-flight request
   */
  async stop(kill: boolean = false): Promise<void> {
    if (!this._options.silent) this._pino.info(`${kill ? 'Killing' : 'Stopping'} HTTP server ${this._server?.id ?? 'NO-ID'}`)
    await this._server?.stop(kill)
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
        if (!isNaN(envPortValue) && envPortValue > -1 && envPortValue < 65535) {
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
}
