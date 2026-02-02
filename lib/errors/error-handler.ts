import type { Bunify } from "../bunify"

export function defaultErrorHandlerFactory(bunify: Bunify) {
  return (error: Bun.ErrorLike) => {
    bunify.log?.error({ err: error }, 'An unhandled exception occured!')
    return Response.json({
      code: 500,
      status: "An unhandled exception occured!"
    }, { status: 500, statusText: 'An unhandled exception occured!' })
  }
}
