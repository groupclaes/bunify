import { BUNIFY_ERR_RESPONSE_STATUS_CODE_INVALID } from "../errors"

const REDIRECT_VALID_STATUSCODES: Record<number, boolean> = {
  300: true,
  301: true,
  302: true,
  303: true,
  304: true,
  305: false, // Deprecated
  306: false, // Reserved, unused
  307: true,
  308: true
}

export function validateStatusCode(statusCode: number) {
  if (statusCode < 100 || statusCode > 999)
    throw BUNIFY_ERR_RESPONSE_STATUS_CODE_INVALID
}

export function validateRedirectStatusCode(statusCode: number) {
  if (!REDIRECT_VALID_STATUSCODES[statusCode])
    throw BUNIFY_ERR_RESPONSE_STATUS_CODE_INVALID
}

export function isValidRedirectStatusCode(statusCode: number) {
  return REDIRECT_VALID_STATUSCODES[statusCode] ?? false
}
