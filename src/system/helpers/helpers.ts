export interface RequestError {
  code: number
  message: string
}

export function requestError(code: number, message: string): RequestError {
  return {
    code,
    message
  }
}
