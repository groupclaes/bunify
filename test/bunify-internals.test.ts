import { test, describe, expect } from 'bun:test'

import { Bunify } from '../lib/bunify'
import { ENV_PORTS_POSSIBLE } from '../lib/options'

describe('Bunify', () => {
  describe('getPort', () => {
    const getPort = (port?: number): number =>
      (new Bunify({ port: 6969 }) as any).getPort(port)

    const cleanupEnvVariables = () => {
      for (const envPort of ENV_PORTS_POSSIBLE) {
        delete process.env[envPort]
      }
    }

    const RANDOM_PORTS = ENV_PORTS_POSSIBLE.map(x => (Math.floor(Math.random() * 3000) + 1) + '')

    const setRandomEnvPorts = () => {
      for (let i = 0; i < ENV_PORTS_POSSIBLE.length; i++) {
        process.env[ENV_PORTS_POSSIBLE[i]!] = RANDOM_PORTS[i]
      }
    }

    test('should return options port', () => {
      expect(getPort(0)).toBe(6969)
      expect(getPort(65536)).toBe(6969)
    })

    test('should return options port if no env or override set', () => {
      expect(getPort()).toBe(6969)
    })

    test('override should return port if positive and not zero', () => {
      expect(getPort(80)).toBe(80)
      expect(getPort(1)).toBe(1)
    })

    test('should return environment variable port if between 0 and 65535', () => {
      for(const envPort of ENV_PORTS_POSSIBLE) {
        for (const port of [ 1, 6969, 4200 ]) {
          cleanupEnvVariables()
          process.env[envPort] = port + ''
          expect(getPort()).toBe(port)
        }
      }
    })

    test('should ignore invalid environment variable port if not between 0 and 65535 or NaN', () => {
      for(const envPort of ENV_PORTS_POSSIBLE) {
        for (const port of [ '-1', '65536', 'cheese' ]) {
          cleanupEnvVariables()
          process.env[envPort] = port
          expect(getPort()).toBe(6969)
        }
      }

      // Cleanup
      cleanupEnvVariables()
    })
    test('should return correct order of env variable ports', () => {
      setRandomEnvPorts()
    
      for (let i = 0; i < RANDOM_PORTS.length; i++) {
        expect(getPort()).toBe(+RANDOM_PORTS[i]!)
        delete process.env[ENV_PORTS_POSSIBLE[i]!]
      }

      // Cleanup
      cleanupEnvVariables()
    })
  })

  describe('getListenHostname', () => {
    const getListenHostname = (ip?: string): string =>
      (new Bunify({ hostname: '127.0.0.1' }) as any).getListenHostname(ip)

    test('override should overriden value if set and longer than 0 chars', () => {
      expect(getListenHostname('whatever')).toBe('whatever')
    })

    test('should return $BUNIFY_HOST if set and longer than 0 chars', () => {
      process.env.BUNIFY_HOST = '127.0.0.2'

      expect(getListenHostname()).toBe('127.0.0.2')

      delete process.env.BUNIFY_HOST
    })

    test('should return options value if no override or env variable', () => {
      expect(getListenHostname()).toBe('127.0.0.1')
    })

    test('should return default if no override, env variable or options is set', () => {
      const getListenHostname = (ip?: string): string =>
        (new Bunify({ hostname: undefined }) as any).getListenHostname(ip)

      expect(getListenHostname()).toBe('0.0.0.0')
    })
  })
})
