import { BunifyError, BunifyResponseError } from './bunify-error'

export {
  BunifyOptionsError,
  // BunifyRequestError,
  BunifyResponseError,
  BunifyError
} from './bunify-error'

export const BUNIFY_ERR_ALREADY_RUNNING = new BunifyError('Server is already running, reload stop or reload the process')
export const BUNIFY_ERR_NOT_RUNNING = new BunifyError('Server isn\'t running!')
export const BUNIFY_ERR_DESC_HOOK_NOT_FOUND = new BunifyError('The provided hook is invalid')
export const BUNIFY_ERR_DESC_ROUTE_EXISTS = new BunifyError('Route already exists, use override to replace')
export const BUNIFY_ERR_DESC_ROUTE_MUST_START_WITH_SLASH = new BunifyError('All routes must start with a prefix slash!')

export const BUNIFY_ERR_REQUEST_INVALID_REQID_HANDLER = new BunifyError('No correct requestId handler has been configured!')
export const BUNIFY_ERR_REQUEST_HOOK_RETURNS_RESPONSE = new BunifyError('Hooks cannot just return a response. Use the route\'s handler instead')
// export const BUNIFY_ERR_DESC_ROUTE_EXISTS = new BunifyError('Cannot override route without override being true')

export const BUNIFY_ERR_RESPONSE_STATUS_CODE_INVALID = new BunifyResponseError('Invalid statuscode was provided')
export const BUNIFY_ERR_RESPONSE_DOESNT_MATCH = new BunifyResponseError('The returned response doesn\'t match the created response!')


export const BUNIFY_ERR_MODULE_PREFIX_MUST_START_WITH_SLASH = new BunifyError('A module prefix must start with a prefix slash!')