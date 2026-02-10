import { describe, expect, test } from 'bun:test';
import { BunifyResponse, type BunifyRequest } from '../lib';


describe('BunifyResponse', () => {
  describe('__constructor__', () => {
    test('should set parent BunifyRequest to _request', () => {
      const bunifyRequest = {} as unknown as BunifyRequest

      const response = new BunifyResponse(bunifyRequest)

      expect((response as any)._request).toEqual(bunifyRequest)
    })

    test('should set startTime correctly', () => {
      const bunifyRequest = {} as unknown as BunifyRequest

      const beforeConstructor = Bun.nanoseconds()
      const response = new BunifyResponse(bunifyRequest)
      const afterConstructor = Bun.nanoseconds()

      expect((response as any)._startTime).toBeWithin(beforeConstructor, afterConstructor)
    })

    test('should set empty response headers', () => {
      const bunifyRequest = {} as unknown as BunifyRequest

      const response = new BunifyResponse(bunifyRequest)

      expect(response.headers.count).toBe(0)
    })


    test('should set init parameters', () => {
      const bunifyRequest = {} as unknown as BunifyRequest

      const headers = new Headers()
      headers.append('Some-Header', 'some_value')

      const response = new BunifyResponse(bunifyRequest, {
        status: 400,
        statusText: 'BAD_REQUEST',
        headers
      })


      expect(response.statusCode).toBe(400)
      expect(response.statusText).toBe('BAD_REQUEST')
      expect(response.headers.get('Some-Header')).toBe('some_value')
    })
  })
})