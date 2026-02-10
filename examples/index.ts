import { BunifyResponse } from './../lib/response';
import type { BunifyRequest } from "@groupclaes/bunify";
import type { BunifyOptions } from "@groupclaes/bunify";
import { Bunify, registerRequestLogger } from "@groupclaes/bunify";
import { getConsoleSink, getJsonLinesFormatter } from '@logtape/logtape';

const bunifyConfiguration: BunifyOptions = {
  // Optional
  hostname: '0.0.0.0',
  // Can be set with environment variable $BUNIFY_PORT, $BUN_PORT, $PORT, $NODE_PORT
  port: 8080,
  // Do not output anything from bunify itself
  silent: true,
  log: {
    sinks: {
      console: getConsoleSink({
        formatter: getJsonLinesFormatter({
          properties: 'flatten',
          categorySeparator: '/',
          message: 'template'
        }),
        nonBlocking: {
          bufferSize: 3000,
          flushInterval: 100
        }
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
        sinks: ["console"]
      },
    ],
  },
  request: {
    logEcsFields: true,
    traceIdHeader: 'X-Trace-Id',
    logIp: true
  }
}

const bunify = new Bunify(bunifyConfiguration)
  .register(registerRequestLogger)
  .get('/hello', (request: BunifyRequest, response: BunifyResponse) => Response.json({ response: 'Hello to you too!' }, { status: 200, statusText: 'A-OK' }))

await bunify.listen()
