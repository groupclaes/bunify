import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, mock, test, type Mock } from 'bun:test';

import type { BunRequest } from 'bun';
import { Bunify, BunifyRequest, BunifyResponse, defaultRequestIdGeneratorFactory, type RequestRoute } from '../lib';
import pino from 'pino';

describe('Request', () => {
  describe('__constructor__', () => {
    test('should create request correctly', () => {
      const bunify = {
        requestOptions: {
          genReqId: () => 10
        },
        log: pino({ })
      } as unknown as Bunify


      const request = new Request('http://localhost/yeet', {}) as BunRequest

      const route: RequestRoute = {
        url: '/yeet',
        method: 'GET',
        timeout: 60,
        handler: (request: BunifyRequest, response: BunifyResponse) => Promise.resolve(Response.json('yeet'))
      }
      const bunifyRequest = new BunifyRequest(bunify, request, route)

      expect(bunifyRequest.bunify).toBe(bunify)
      expect(bunifyRequest.route).toBe(route)
      expect((bunifyRequest as any)._request).toBe(request)

      expect(bunifyRequest.requestId).toBe(10)
      expect(bunifyRequest.traceId).toBeUndefined()

      expect(bunifyRequest.log).not.toBeUndefined()
    })
  })

  describe('getTraceId', () => {
    test('should not have a traceId without requestOptions configured', () => {
      const bunify = {
        requestOptions: { genReqId: () => 4304 }
      } as unknown as Bunify

      const traceId = Bun.randomUUIDv7()
      const bunRequest = new Request('http://localhost/yeet', {
        headers: {
          'X-Trace-Id': traceId
        }
      }) as BunRequest
  
      const request = new BunifyRequest(bunify, bunRequest, {} as RequestRoute)

      expect((request as any).getTraceId()).toBeUndefined()

      // Act & Assert
      expect(request.traceId).toBeUndefined()
    })

    test('should return the requestOptions-configured traceId header', () => {
      // Arrange
      const bunify = {
        requestOptions: {
          traceIdHeader: 'X-Trace-Id',
          genReqId: () => 4304
        }
      } as unknown as Bunify

      const traceId = Bun.randomUUIDv7()
      const bunRequest = new Request('http://localhost/yeet', {
        headers: {
          'X-Trace-Id': traceId
        }
      }) as BunRequest

      const request = new BunifyRequest(bunify, bunRequest, {} as RequestRoute)

      // Act & Assert
      expect(request.traceId).toBe(traceId)
    })

    test('should return no traceId if header doesn\'t exist', () => {
      // Arrange
      const bunify = {
        requestOptions: {
          traceIdHeader: 'X-Trace-Id',
          genReqId: () => 4304
        }
      } as unknown as Bunify

      const traceId = Bun.randomUUIDv7()
      const bunRequest = new Request('http://localhost/yeet', {
        headers: {
          'Invalid-Trace-Id': traceId
        }
      }) as BunRequest
      const request = new BunifyRequest(bunify, bunRequest, {} as RequestRoute)

      // Act & Assert
      expect(request.traceId).toBeUndefined()
    })
  })

  describe('getRequestId', () => {
    test('should throw when no genReqId is set', () => {
      const bunify = {} as Bunify

      const bunRequest = new Request('http://localhost/yeet', {}) as BunRequest
      
      expect(() => new BunifyRequest(bunify, bunRequest, {} as RequestRoute)).toThrowError('No correct requestId handler has been configured!')
    })

    test.each([ 6969, Bun.randomUUIDv7(), 1, 2, 3 ])('should use the returned value by the generator function', (generatedId) => {
      const bunify = {
        requestOptions: {
          genReqId: (request: BunifyRequest): string | number => generatedId
        }
      } as unknown as Bunify

      const bunRequest = new Request('http://localhost/yeet', {}) as BunRequest
      const request = new BunifyRequest(bunify, bunRequest, {} as RequestRoute)

      expect(request.requestId).toBe(generatedId)
      expect((request as any).getRequestId()).toBe(generatedId)
    })
  })

  describe('getRequestIp', () => {
    test('should setup the correct client Ip, port and family', () => {
      const mockRequestIp = mock((_: BunRequest): Bun.SocketAddress => ({
        address: '::1',
        port: 6969,
        family: 'IPv6'
      }))

      const bunify = {
        requestOptions: {
          genReqId: (_: BunifyRequest) => 1000
        },
        _server: {
          requestIP: mockRequestIp
        }
      } as unknown as Bunify

      const bunRequest = new Request('http://localhost/yeet', {}) as BunRequest
      const bunifyRequest = new BunifyRequest(bunify, bunRequest, {} as RequestRoute)
      
      expect((bunifyRequest as any).getRequestIp()).toEqual({
        address: '::1',
        port: 6969,
        family: 'IPv6'
      })
    })


    test.todo('should return proxy specified client ip, port and family', () => {})
  })
})