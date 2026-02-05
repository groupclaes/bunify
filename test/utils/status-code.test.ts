import { describe, expect, test } from 'bun:test';
import { validateStatusCode } from '../../lib/utils/status-code';


describe('Status code', () => {
  describe('validateStatusCode', () => {
    test.each([0, 6969, 4201])('should throw when HTTP statuscode is invalid',
      (statusCode) =>
        expect(() => validateStatusCode(statusCode))
          .toThrowError('Invalid statuscode was provided'))
  })
})
