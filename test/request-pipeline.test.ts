import { RequestHandlerFunction, RequestHookResult, type RequestHook } from './../lib/models/request-route';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { BunifyRequest, BunifyResponse } from '../lib'
import { catchResponseOrContinue, executeRequestAndRouteHook, executeRequestHook, parseBunifyResponse } from '../lib/request-pipeline';

describe('Request-Pipeline', () => {
  describe('parseBunifyResponse', () => {
    let request: BunifyRequest
    let response: BunifyResponse
    
    beforeEach(() => {
      request = {} as BunifyRequest
      response = new BunifyResponse(request, {
        status: 200,
        statusText: 'OK',
        url: '/test',
        headers: new Headers()
      })
    })

    afterEach(() => {
      mock.restore()
      mock.clearAllMocks()
    })

    test('should return if response is not set', () => {
      const spySend = spyOn(response, "send")
      const spyCode = spyOn(response, "code")

      expect(parseBunifyResponse(response))
        .toBeUndefined()

      expect(spySend).toHaveBeenCalledTimes(0)
      expect(spyCode).toHaveBeenCalledTimes(0)
    })

    test('should throw if returned response isn\'t the request-bound response', () => {
      const spySend = spyOn(response, "send")
      const spyCode = spyOn(response, "code")

      expect(() => parseBunifyResponse(response, new BunifyResponse(request, {
        status: 400,
        statusText: 'BAD_REQUEST',
        url: '/test2',
        headers: new Headers()
      })))
        .toThrowError('The returned response doesn\'t match the created response!')

      expect(spySend).toHaveBeenCalledTimes(0)
      expect(spyCode).toHaveBeenCalledTimes(0)
    })

    test('should return bunifyResponse.send value if response equals the requestResponse', () => {
      const spySend = spyOn(response, "send")
      const spyCode = spyOn(response, "code")

      const expectedResponse = new Response('', {
        headers: new Headers(),
        status: 200,
        statusText: 'OK'
      })
      spySend.mockReturnValue(expectedResponse)

      expect(parseBunifyResponse(response, response))
        .toBe(expectedResponse)

      expect(spySend).toHaveBeenCalledTimes(1)
      expect(spyCode).toHaveBeenCalledTimes(0)
    })



    test('should return response and set bunifyResponse statusCode', () => {
      const expectedResponse = new Response('', {
        headers: new Headers(),
        status: 400,
        statusText: 'BAD_REQUEST'
      })

      expect(parseBunifyResponse(response, expectedResponse))
        .toBe(expectedResponse)

      expect(response.statusCode).toBe(expectedResponse.status)
      expect(response.statusText).toBe(expectedResponse.statusText)
    })
  })

  describe('catchResponseOrContinue', () => {
    let request: BunifyRequest
    let response: BunifyResponse
    
    beforeEach(() => {
      request = {} as BunifyRequest
      response = new BunifyResponse(request, {
        status: 400,
        statusText: 'BAD_REQUEST',
        url: '/test2',
        headers: new Headers()
      })
    })

    test.each([
      [ 
        () => Promise.resolve(response),
        400,
        'BAD_REQUEST'
      ],
      [
        () => Promise.resolve(Response.json({ yeet: "cheese" }, { status: 401, statusText: 'UNAUTHORIZED' })),
        401,
        'UNAUTHORIZED'
      ],
      [
        () => response,
        400,
        'BAD_REQUEST'
      ],
      [
        () => Response.json({ yeet: "cheese" }, { status: 403, statusText: 'FORBIDDEN' }),
        403,
        'FORBIDDEN'
      ],

    ])('should return response if handleResult is a valid BunifyResponse or Response or promise', async (handleResult, statusCode, statusText) => {
      const result = await catchResponseOrContinue(handleResult(), response)
      expect(result).not.toBeUndefined()

      expect(result?.status).toBe(statusCode)
      expect(result?.statusText).toBe(statusText)
    })

    test('should call parseBunifyResponse and return nothing if undefined/void', async () => {
      const parseMock = mock((requestResponse: BunifyRequest, response?: Response | BunifyResponse) => undefined)
      mock.module("../lib/request-pipeline", () => {
        return {
          catchResponseOrContinue,
          parseBunifyResponse: parseMock
        };
      });

      const result = await catchResponseOrContinue(
        Response.json({ yeet: "cheese" }, { status: 403, statusText: 'FORBIDDEN' }),
        response)

      expect(parseMock).toHaveBeenCalledTimes(1)
      expect(result).toBeUndefined()
      
    })

    test('should call parseBunifyResponse and return the parseBunifyResponse response', async () => {
      const parseMock = mock((requestResponse: BunifyRequest, response?: Response | BunifyResponse) => response)
      mock.module("../lib/request-pipeline", () => {
        return {
          catchResponseOrContinue,
          parseBunifyResponse: parseMock
        };
      });

      const resultResponse = Response.json({ yeet: "cheese" }, { status: 403, statusText: 'FORBIDDEN' })

      const result = await catchResponseOrContinue(
        Response.json({ yeet: "cheese" }, { status: 403, statusText: 'FORBIDDEN' }),
        response)

      expect(parseMock).toHaveBeenCalledTimes(1)
      expect(result).toEqual(resultResponse)
      
    })
  })

  describe('executeRequestHook', () => {
    let request: BunifyRequest
    let response: BunifyResponse

    const catchResponseMock = mock(((handler: (request: BunifyRequest, response: BunifyResponse) => RequestHookResult, response: BunifyResponse) => {}) as () => Promise<Response | undefined>)
    beforeAll(() => {
      mock.module("../lib/request-pipeline", () => {
        return {
          executeRequestHook,
          catchResponseOrContinue: catchResponseMock
        };
      });
    })


    beforeEach(() => {
      request = {} as BunifyRequest
      response = new BunifyResponse(request, {
        status: 400,
        statusText: 'BAD_REQUEST',
        url: '/test2',
        headers: new Headers()
      })
    })

    afterAll(() => {
      mock.restore()
      mock.clearAllMocks()
    })

    test('should execute hook if not an array', async () => {
      const functionMock = mock((request: BunifyRequest, response: BunifyResponse) => {})
      

      expect(await executeRequestHook(functionMock, request, response)).toBeUndefined()

      expect(functionMock).toHaveBeenCalledTimes(1)
    })

    test('should execute all hooks if an array', async () => {
      const functionMock = mock((request: BunifyRequest, response: BunifyResponse) => {})
      

      expect(await executeRequestHook([ functionMock, functionMock, functionMock ], request, response))
        .toBeUndefined()

      expect(functionMock).toHaveBeenCalledTimes(3)
    })

    test('should execute all hooks until one returns a response', async () => {
      const expectedResponse = Response.json({ yeet: 'value' }, { status: 400, statusText: 'BAD_REQUEST' })
      const functionMock = mock(((request: BunifyRequest, response: BunifyResponse) => {}) as RequestHook)

      catchResponseMock.mockReturnValueOnce(Promise.resolve(undefined))
      catchResponseMock.mockReturnValueOnce(Promise.resolve(expectedResponse))
      catchResponseMock.mockReturnValueOnce(Promise.resolve(undefined))
      catchResponseMock.mockReturnValueOnce(Promise.resolve(undefined))
      

      const result = await executeRequestHook([ functionMock, functionMock, functionMock, functionMock, functionMock ], request, response)

      expect(functionMock).toHaveBeenCalledTimes(2)
      expect(result).not.toBeUndefined()
      expect((result as Response).status).toBe(expectedResponse.status)
      expect((result as Response).statusText).toBe(expectedResponse.statusText)
    })

    test('should return undefined if no hook returns a response', async () => {
      const functionMock = mock(((request: BunifyRequest, response: BunifyResponse) => {}) as RequestHook)

      const result = await executeRequestHook([ functionMock, functionMock, functionMock, functionMock, functionMock ], request, response)

      expect(functionMock).toHaveBeenCalledTimes(5)
      expect(result).toBeUndefined()
    })

    test('should throw if the hook isn\'t a function', () => {
      expect(() => executeRequestHook({} as unknown as any, request, response))
        .toThrowError('Hooks cannot just return a response. Use the route\'s handler instead')
    })
    test('should throw if the hook array countains one non-function', () => {
      const functionMock = mock(((request: BunifyRequest, response: BunifyResponse) => {}) as RequestHook)
      const hooks = [
        functionMock,
        functionMock,
        functionMock,
        {} as unknown as any,
        functionMock,
        functionMock
      ]

      expect(() => executeRequestHook(hooks, request, response))
        .toThrowError('Hooks cannot just return a response. Use the route\'s handler instead')
      expect(functionMock).toHaveBeenCalledTimes(3)
    })
  })

  describe('executeRequestAndRouteHook', () => {
    let request: BunifyRequest
    let response: BunifyResponse

    const functionMock = mock((requestHookInput: RequestHook | RequestHook[],
      request: BunifyRequest, bunifyResponse: BunifyResponse) => {})
    beforeAll(() => {
      mock.module("../lib/request-pipeline", () => {
        return {
          executeRequestHook: functionMock
        };
      });
    })


    beforeEach(() => {
      functionMock.mockReset()
  
      request = {} as BunifyRequest
      response = new BunifyResponse(request, {
        status: 400,
        statusText: 'BAD_REQUEST',
        url: '/test2',
        headers: new Headers()
      })
    })

    afterAll(() => {
      mock.restore()
      mock.clearAllMocks()
    })

    test('should return void if no request hook or route hook returns a response', async () => {
      const hookMock = mock((request: BunifyRequest, response: BunifyResponse) => {})

      functionMock.mockResolvedValue(undefined)

      expect(await executeRequestAndRouteHook(
        hookMock,
        hookMock,
        request, response)).toBeUndefined()

      expect(functionMock).toHaveBeenCalledTimes(2)
    })

    test('should return void if no request hooks array or route hooks array returns a response', async () => {
      const hookMock = mock((request: BunifyRequest, response: BunifyResponse) => {})

      functionMock.mockResolvedValue(undefined)

      expect(await executeRequestAndRouteHook(
        [ hookMock, hookMock, hookMock, hookMock ],
        [ hookMock, hookMock ],
        request, response)).toBeUndefined()


      expect(functionMock).toHaveBeenCalledTimes(2)
    })


    test('should return the response if one requestHook returns a Response', async () => {
      const hookMock = mock((request: BunifyRequest, response: BunifyResponse) => {})

      functionMock.mockResolvedValue(Response.json({ yeet: "cheese" }, { status: 403, statusText: 'FORBIDDEN' }))


      const result = await executeRequestAndRouteHook(
        [ hookMock, hookMock, hookMock, hookMock ],
        [ hookMock, hookMock ],
        request, response)
      expect(result).not.toBeUndefined()
      expect((result as Response).status).toBe(403)
      expect((result as Response).statusText).toBe('FORBIDDEN')
      expect(await (result as Response).json()).toEqual({ yeet: 'cheese' })


      expect(functionMock).toHaveBeenCalledTimes(1)
    })
    test('should return the response if one route hook returns a Response', async () => {
      const hookMock = mock((request: BunifyRequest, response: BunifyResponse) => {})

      functionMock.mockResolvedValueOnce(undefined)
      functionMock.mockResolvedValueOnce(Response.json({ yeet: "cheese" }, { status: 403, statusText: 'FORBIDDEN' }))


      const result = await executeRequestAndRouteHook(
        [ hookMock, hookMock, hookMock, hookMock ],
        [ hookMock, hookMock ],
        request, response)
      expect(result).not.toBeUndefined()
      expect((result as Response).status).toBe(403)
      expect((result as Response).statusText).toBe('FORBIDDEN')
      expect(await (result as Response).json()).toEqual({ yeet: 'cheese' })


      expect(functionMock).toHaveBeenCalledTimes(2)
    })
  })
})