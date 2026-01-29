import {describe, test, expect, afterEach} from 'bun:test'
import { BunifyOptionsValidator, ENV_PORTS_POSSIBLE } from '../lib/options'
import { BunifyOptionsError } from '../lib/errors'

describe('BunifyOptionsValidator', () => {
  describe('validate', () => {
    const VALID_PORTS = [ 1, 4200, 6969, 45000, 65535 ]

    test('should not throw if port is nullish', () => {
      const config = {
        port: undefined
      }

      expect(() => BunifyOptionsValidator.validate(config)).not.toThrowError(BunifyOptionsError)
    })

    test('should throw if port is invalid', () => {
      expect(() => BunifyOptionsValidator.validate({ port: -1 }))
        .toThrowError(new BunifyOptionsError('Port set in options is an invalid port: -1'))

      expect(() => BunifyOptionsValidator.validate({ port: 65536 }))
        .toThrowError(new BunifyOptionsError('Port set in options is an invalid port: 65536'))
    })

    test('should not throw if port is valid', () => {
      expect(() => BunifyOptionsValidator.validate({ port: (Math.floor(Math.random() * 65535) + 1) }))
        .not.toThrowError(BunifyOptionsError)
    }, { repeats: 9 })

    test.each(VALID_PORTS)('should not throw if port is valid', (port) => {
      expect(() => BunifyOptionsValidator.validate({ port }))
        .not.toThrowError(BunifyOptionsError)
    })

    test.each(ENV_PORTS_POSSIBLE)('should throw if port env variable %p is invalid', (env) => {
      process.env[env] = '-1'
      expect(() => BunifyOptionsValidator.validate({}))
        .toThrowError(new BunifyOptionsError(`Found environment variable ${env} with invalid port value -1`))

      process.env[env] = '65536'
      expect(() => BunifyOptionsValidator.validate({}))
        .toThrowError(new BunifyOptionsError(`Found environment variable ${env} with invalid port value 65536`))
    })

    const cleanupEnvVariables = () => {
      for (const envPort of ENV_PORTS_POSSIBLE) {
        delete process.env[envPort]
      }
    }
    afterEach(cleanupEnvVariables)
  })
})