export interface RequestMessage<Data = any> {
  // session id
  sessionId?: string
  // generate it on client to have a certain request
  requestId: string
  // unique identifier which will handle a request
  url: string
  data?: Data
}

export interface ResponseMessage<Data = any> {
  requestId: string
  data?: Data
  errorStatus?: number
  errorMessage?: string
}
