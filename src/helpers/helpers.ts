import {makeUniqId} from 'squidlet-lib'
import {REQUEST_ID_LENGTH} from '../types/constants.js'


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


/**
 * Common request id.
 * Used by WsAppApi service
 */
export function makeRequestId(): string {
  return makeUniqId(REQUEST_ID_LENGTH)
}
