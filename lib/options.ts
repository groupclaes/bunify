import type { LoggerOptions } from 'pino'
import { BunifyOptionsError } from './errors'
import type { TLSOptions } from 'bun'
import type pino from 'pino'

/**
 * @internal
 */
export const ENV_PORTS_POSSIBLE = [ "BUNIFY_PORT", "BUN_PORT", "PORT", "NODE_PORT" ]

export interface BunifyOptions {
  /**
   * Do not output anything from Bunify to pino
   * @default false
   */
  silent?: boolean
  /**
   * Collect statistics
   */
  statistics?: {
    /**
     * Amount of seconds inbetween metrics logging to pino
     * @default 0 disabled metrics logging
     */
    metricsLogInterval?: number
    /**
     * Endpoint url to GET the metrics from the API
     * @default false
     */
    metricsEndpoint?: string
    /**
     * Track the total processed requests during the runtime
     * @default false
     */
    requests?: boolean
    /**
     * Track the total amount of exceptions that occurred during the runtime
     * @default false
     */
    errors?: boolean
    /**
     * Track all http redirects during the runtime
     * @default false
     */
    redirects?: boolean
  }
  /**
   * Pino logging configuration
   */
  log?: LoggerOptions | pino.Logger
  /**
   * Service details to be put in the structured logs
   */
  service?: {
    name?: string
    version?: string
  }
  /**
   * Bun server port to use
   * @default $BUNIFY_PORT, $BUN_PORT, $PORT, $NODE_PORT, 3000
   */
  port?: number
  /**
   * Bun server hostname to listen on
   *
   * @default
   * ```js
   * "0.0.0.0" // listen on all interfaces
   * ```
   * @example
   *  ```js
   * "127.0.0.1" // Only listen locally
   * ```
   * @example
   * ```js
   * "remix.run" // Only listen on remix.run
   * ````
   *
   * note: hostname should not include a {@link port}
   * @default $BUNIFY_HOST, "0.0.0.0"
   */
  hostname?: "0.0.0.0" | "127.0.0.1" | "localhost" | (string & {})
  /**
   * Only listen on the IPv6 stack
   */
  ipv6Only?: boolean
  /**
   * Enable Bun's built-in error pages
   * @default $BUN_ENV, $NODE_ENV
   */
  development?: boolean,
  tls: TLSOptions | TLSOptions[],
  request?: {
    /**
     * Enable request time tracking
     * @default false
     */
    executionTime?: boolean
  }
}


export class BunifyOptionsValidator {
  public static validate(options: BunifyOptions) {
    if (options.port && (options.port < 0 || options.port > 65535))
      throw new BunifyOptionsError(`Port set in options is an invalid port: ${options.port}`)


    for (const envPort of ENV_PORTS_POSSIBLE) {
      if (process.env[envPort] && process.env[envPort].length > 0) {
        if (!isNaN(+process.env[envPort]))
          throw new BunifyOptionsError(`Found environment variable ${envPort} with invalid port value ${process.env[envPort]}`)
        else
          options.port = +process.env[envPort]
      }
    }
  }
}