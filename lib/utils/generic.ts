export function isPromiseLike(value: any): boolean {
  return value != null && ((typeof (value as any).then) === 'function')
}

export function isObject(value: any) {
  return value != null && typeof value === 'object'
}
