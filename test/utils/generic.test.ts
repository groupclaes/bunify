import { describe, expect, test } from 'bun:test';
import { isObject, isPromiseLike } from '../../lib/utils/generic';
import { Bunify } from '../../lib';

describe('Generic', () => {
  describe('isPromiseLike', () => {
    test('should return true if actual promise is tested', () => {
      expect(isPromiseLike(Promise.resolve('yeet'))).toBeTrue()
    })
    test.each([ null, undefined, false ])('should return false if nullish',
      (value) => expect( isPromiseLike(value) ).toBeFalse()
    )

    test.each([ 'string', 1, {}, Bun, true ])('should return false if not promise like',
      (value) => expect( isPromiseLike(value) ).toBeFalse()
    )
  })

  describe('isObject', () => {
    test.each([ {}, new Bunify({  }) ])('should return true if actual object',
      (value) => expect( isObject(value) ).toBeTrue()
    )

    test.each([ null, undefined, false ])('should return false if nullish',
      (value) => expect( isObject(value) ).toBeFalse()
    )

    test.each([ 'string', 1, true, false ])('should return false if not an object like', (value) => {
      expect(isObject(value)).toBeFalse()
    })
  })
})