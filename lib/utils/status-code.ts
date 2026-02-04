import { BUNIFY_ERR_RESPONSE_STATUS_CODE_INVALID } from "../errors"

export function validateStatusCode(statusCode: number) {
  if (statusCode < 100 || statusCode > 1000)
    throw BUNIFY_ERR_RESPONSE_STATUS_CODE_INVALID
}
