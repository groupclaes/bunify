import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { Bunify } from '../../lib/bunify';
import { RequestLifecycle, type BunifyRequest, type BunifyResponse } from '../../lib';



describe('Bunify E2E', () => {
  describe('Hooks', () => {
    let bunify: Bunify
    beforeEach(async () => {
      bunify = new Bunify({
      })

      bunify.get('/', (request: BunifyRequest, response: BunifyResponse) => {
        response.code(200)
        response.statusText = 'yeet'

        return Response.json({ "yeet": "yeah, yeet" })
      })
      bunify.get('/some/weird/path', (request: BunifyRequest, response: BunifyResponse) => {
        response.code(400)
        response.statusText = 'bad_yeet'

        return response
      })


      await bunify.listen()
    })
    afterEach(async () => {
      try { await bunify.stop(true) } catch {}
    })


    test.each(Object.values(RequestLifecycle)).todo(
      'should execute appended request hook',
      async (lifecycle: RequestLifecycle) => {
        const mockHook = mock((request: BunifyRequest, response: BunifyResponse) => {
          return Promise.resolve(undefined)
        })
    
        bunify.addHook(lifecycle, mockHook)

        const result = await fetch(`http://${bunify.hostname}:${bunify.port}/`)
        const resultText = await result.json()

        // expect(mockHook).toHaveBeenCalled()
      })

    test.each(Object.values(RequestLifecycle)).todo(
      'should execute all appended request hooks',
      async (lifecycle: RequestLifecycle) => {
        const mockHook = mock((request: BunifyRequest, response: BunifyResponse) => {})
        const mockHookTwo = mock((request: BunifyRequest, response: BunifyResponse) => {})

        bunify.addHook(lifecycle, [ mockHook, mockHookTwo ])


        const result = await fetch(`http://${bunify.hostname}:${bunify.port}/`)
        const resultText = await result.json()

        // expect(mockHook).toHaveBeenCalled()
        // expect(mockHookTwo).toHaveBeenCalledTimes(1)
        
      })
  })
})