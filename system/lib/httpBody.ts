// TODO: move HttpContentType to interfaces
import {HttpContentType} from '../interfaces/io/HttpServerIo';
import {JsonTypes} from '../interfaces/Types';


/**
 * Parse request body
 */
export function parseBody(contentType?: HttpContentType, body?: string | Uint8Array): JsonTypes | Uint8Array {
  // TODO: резолвить с contentType
  if (typeof body === 'undefined') {
    return;
  }
  else if (body instanceof Uint8Array) {
    return body;
  }
  else if (typeof body !== 'string') {
    throw new Error(`Unsupported type of body ${typeof body}`);
  }

  try {
    return JSON.parse(body);
  }
  catch (e) {
    // just string, maybe html
    return body;
  }
}

/**
 * Prepare body to response
 */
export function prepareBody(
  contentType: HttpContentType,
  fullBody: JsonTypes | Uint8Array
): string | Uint8Array | undefined {

  // TODO: body - если object - то JSON.stringify
  // TODO: атоматом сделать JSON.stringify
  // TODO: атоматом установить content-type
}

/**
 * Resolve body type which will be prepared in prepareBody() and sent. Logic
 * * undefined => undefined
 * * Uint8Array => application/octet-stream
 * * has "doctype html" => text/html
 * * string
 * * number, boolean, null, [] or {} => application/json
 */
export function resolveBodyType(fullBody: JsonTypes | Uint8Array): HttpContentType | undefined {
  if (typeof fullBody === 'undefined') {
    return;
  }
  else if (fullBody instanceof Uint8Array) {
    return 'application/octet-stream';
  }
  else if (typeof fullBody === 'string') {
    if (fullBody.match(/^\s*<!DOCTYPE\s+html/i)) return 'text/html';

    return 'text/plain';
  }

  // number, boolean, null, [] or {}
  return 'application/json';
}
