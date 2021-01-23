export const NETWORK_ACTION_SEPARATOR = '.'

export enum NETWORK_CHANNELS {
  request = 240,
  successResponse,
  errorResponse,

  eventRegisterRequest,
  eventRegisterResponseOk,
  eventRegisterResponseFail,
  eventOffRequest,
  eventOffResponseOk,
  eventOffResponseFail,
  eventEmit,
}

export enum NETWORK_ERROR_CODE {
  // Can't resolve route to host
  noRoute,
  // uri handler hasn't been found at destination host
  noHandler,
  // error which handler has risen while executing
  handlerError,
}


// export enum NETWORK_MESSAGE_TYPE {
//   request,
//   // response
//   success,
//   ///// errors
//   // Can't resolve root to host
//   noRoot = 11,
//   // uri handler hasn't been found at destination host
//   noHandler,
//   // error which handler has risen while executing
//   handlerError,
// }
