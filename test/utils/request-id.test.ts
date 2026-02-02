import { describe, test, expect, beforeEach } from 'bun:test'
import { Bunify, defaultRequestIdGeneratorFactory, defaultRequestUUIDGeneratorFactory } from '../../lib'
import type { BunRequest } from 'bun'

describe('RequestId', () => {
  describe('defaultRequestIdGeneratorFactory', () => {

    test('should set the bunify instance request id to 1 on init', () => {
      const bunify = {} as unknown as any
  
      (bunify as any)._next_request_id = 1000

      defaultRequestIdGeneratorFactory(bunify)

      expect((bunify as any)._next_request_id).toBe(1)
    })


    test('should return a requestId generator that increments by 1', () => {
      const bunify = { requestOptions: { idHeader: false } } as unknown as Bunify

      const generator = defaultRequestIdGeneratorFactory(bunify)

      expect((bunify as any)._next_request_id).toBe(1)
      expect(generator({} as unknown as BunRequest)).toBe(1)

      expect((bunify as any)._next_request_id).toBe(2)
      expect(generator({} as unknown as BunRequest)).toBe(2)
      expect((bunify as any)._next_request_id).toBe(3)
    })


    test('should return a requestId generator that increments by 1 if idHeader is not found', () => {
      const bunify = { requestOptions: { idHeader: 'non-existant' } } as unknown as Bunify
      const fakeRequest = { headers: { get: () => null }} as unknown as BunRequest

      const generator = defaultRequestIdGeneratorFactory(bunify)

      expect((bunify as any)._next_request_id).toBe(1)
      expect(generator(fakeRequest)).toBe(1)

      expect((bunify as any)._next_request_id).toBe(2)
      expect(generator(fakeRequest)).toBe(2)
  
      expect((bunify as any)._next_request_id).toBe(3)
    })


    test('should return a requestId generator that returns the found idHeader from the request headers and not increment', () => {
      const bunify = { requestOptions: { idHeader: 'non-existant' } } as unknown as Bunify
      const fakeRequest = { headers: { get: () => 'req-0000039d' }} as unknown as BunRequest

      const generator = defaultRequestIdGeneratorFactory(bunify)

      expect((bunify as any)._next_request_id).toBe(1)
      expect(generator(fakeRequest)).toBe('req-0000039d')
      expect((bunify as any)._next_request_id).toBe(1)
    })
  })


  describe('defaultRequestUUIDGeneratorFactory', () => {
    test('should return a requestId generator that generates random UUIDv7s', () => {
      const bunify = { requestOptions: { idHeader: false } } as unknown as Bunify

      const generator = defaultRequestUUIDGeneratorFactory(bunify)

      const generatedResult = generator({} as unknown as BunRequest)
      
      expect(generatedResult).toHaveLength(36)
    })


    test('should return a requestId generator that generates random UUIDv7s if idHeader is not found', () => {
      const bunify = { requestOptions: { idHeader: 'non-existant' } } as unknown as Bunify
      const fakeRequest = { headers: { get: () => null }} as unknown as BunRequest

      const generator = defaultRequestUUIDGeneratorFactory(bunify)

      const generatedResult = generator(fakeRequest)
      
      expect(generatedResult).toHaveLength(36)
    })

    test('should return a requestId generator that generates random UUIDv7s if idHeader is valid', () => {
      const bunify = { requestOptions: { idHeader: 'non-existant' } } as unknown as Bunify
      const fakeRequest = { headers: { get: () => '019c1f51-6062-7000-9486-835eb27f8919' }} as unknown as BunRequest

      const generator = defaultRequestUUIDGeneratorFactory(bunify)

      const generatedResult = generator(fakeRequest)
      
      expect(generatedResult).toHaveLength(36)
      expect(generatedResult).toBe('019c1f51-6062-7000-9486-835eb27f8919')
    })
  })
})