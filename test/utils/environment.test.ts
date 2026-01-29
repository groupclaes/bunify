import { describe, test, expect } from 'bun:test'
import { EnvUtils } from '../../lib/utils/environment'

describe('EnvUtils', () => {
  describe('getEnvBoolean', () => {
    test('should return false if env variable doesn\'t exist', () => {
      delete process.env.BUN_ENV

      expect(EnvUtils.getEnvBoolean('BUN_ENV')).toBeFalse()
    })

    test('should return false if empty', () => {
      process.env.NODE_ENV = ''

      expect(EnvUtils.getEnvBoolean('NODE_ENV')).toBeFalse()
    })

    test('should return false if isn\'t 1 or true', () => {
      process.env.NODE_ENV = 'false'

      expect(EnvUtils.getEnvBoolean('NODE_ENV')).toBeFalse()
    })

    test('should return true if no variable in array is 1 or true', () => {
      process.env.BUN_ENV = ''
      process.env.NODE_ENV = ''
      expect(EnvUtils.getEnvBoolean(
        ['BUN_ENV', 'NODE_ENV'])).toBeFalse()
    })


    test('should return true if equals 1 or true', () => {
      process.env.NODE_ENV = '1'
      expect(EnvUtils.getEnvBoolean('NODE_ENV')).toBeTrue()
      process.env.NODE_ENV = 'true'
      expect(EnvUtils.getEnvBoolean('NODE_ENV')).toBeTrue()
    })


    test('should return true if any variable in array is 1 or true', () => {
      process.env.BUN_ENV = ''
      process.env.NODE_ENV = '1'
      expect(EnvUtils.getEnvBoolean(
        ['BUN_ENV', 'NODE_ENV'])).toBeTrue()
      process.env.NODE_ENV = 'true'
      expect(EnvUtils.getEnvBoolean(
        ['BUN_ENV', 'NODE_ENV'])).toBeTrue()
    })
  })

  describe('envEquals', () => {
    test('should return false if variable is not set', () => {
      delete process.env.BUN_ENV

      expect(EnvUtils.envEquals('BUN_ENV', 'whatever')).toBeFalse()
    })
    test('should return false no variable in list is set', () => {
      delete process.env.BUN_ENV
      delete process.env.NODE_ENV

      expect(EnvUtils.envEquals(['BUN_ENV', 'NODE_ENV'], 'whatever')).toBeFalse()
    })

    test('should return true if variable matches', () => {
      process.env.BUN_ENV = 'development'
      expect(EnvUtils.envEquals(
        'BUN_ENV', 'development'))
        .toBeTrue()
      expect(EnvUtils.envEquals(
        'BUN_ENV', 'DEvelopment'))
        .toBeTrue()
      expect(EnvUtils.envEquals(
        'BUN_ENV', 'DEVELOPMENT'))
        .toBeTrue()
    })
    test('should return true if any variable in list matches', () => {
      process.env.BUN_ENV = 'production'
      process.env.NODE_ENV = 'development'
      expect(EnvUtils.envEquals(
        ['BUN_ENV', 'NODE_ENV'], 'development'))
        .toBeTrue()
      expect(EnvUtils.envEquals(
        ['BUN_ENV', 'NODE_ENV'], 'DEvelopment'))
        .toBeTrue()
      expect(EnvUtils.envEquals(
        ['BUN_ENV', 'NODE_ENV'], 'DEVELOPMENT'))
        .toBeTrue()
    })

    test('should return false if variable doesn\'t match', () => {
      process.env.BUN_ENV = 'production'
      expect(EnvUtils.envEquals(
        'BUN_ENV', 'development'))
        .toBeFalse()
      expect(EnvUtils.envEquals(
        'BUN_ENV', 'DEvelopment'))
        .toBeFalse()
      expect(EnvUtils.envEquals(
        'BUN_ENV', 'DEVELOPMENT'))
        .toBeFalse()
    })
    test('should return false if no variable in list matches', () => {
      process.env.BUN_ENV = 'production'
      process.env.NODE_ENV = 'production'
      expect(EnvUtils.envEquals(
        ['BUN_ENV', 'NODE_ENV'], 'development'))
        .toBeFalse()
      expect(EnvUtils.envEquals(
        ['BUN_ENV', 'NODE_ENV'], 'DEvelopment'))
        .toBeFalse()
      expect(EnvUtils.envEquals(
        ['BUN_ENV', 'NODE_ENV'], 'DEVELOPMENT'))
        .toBeFalse()
    })
  })
})
