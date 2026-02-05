import { BUNIFY_ERR_RESPONSE_STATUS_CODE_INVALID } from "../errors"

export function validateStatusCode(statusCode: number) {
  if (statusCode < 100 || statusCode > 1000)
    throw BUNIFY_ERR_RESPONSE_STATUS_CODE_INVALID
}

export function validateRedirectStatusCode(statusCode: number) {
  if (statusCode < 300 || statusCode > 308)
    throw BUNIFY_ERR_RESPONSE_STATUS_CODE_INVALID
}

export function isValidRedirectStatusCode(statusCode: number) {
  return statusCode > 299 && statusCode < 309
}
