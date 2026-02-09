import { describe, expect, test } from 'bun:test';
import { isValidRedirectStatusCode, validateRedirectStatusCode, validateStatusCode } from '../../lib/utils/status-code';


describe('Status code', () => {
  describe('validateStatusCode', () => {
    test.each([0, 6969, 4201])('should throw when HTTP statuscode is invalid',
      (statusCode) =>
        expect(() => validateStatusCode(statusCode))
          .toThrowError('Invalid statuscode was provided'))
  })

  describe('validateRedirectStatusCode', () => {
    test.each([0, 200, 204, 299, 309, 400, 404, 500])('should throw error if statusCode is below 300 or above 308', (statusCode) => {
      expect(() => validateRedirectStatusCode(statusCode))
        .toThrowError('Invalid statuscode was provided')
    })
  })

  describe('isValidRedirectStatusCode', () => {
    test.each([0, 200, 204, 299, 309, 306, 305, 400, 404, 500])('should return false if statusCode is invalid', (statusCode) =>
      expect(isValidRedirectStatusCode(statusCode))
        .toBeFalse()
    )

    test.each([300, 301, 302, 303, 304, 307, 308])('should return true if statusCode is a valid redirect code', (statusCode) =>
      expect(isValidRedirectStatusCode(statusCode))
        .toBeTrue()
    )
  })
})
