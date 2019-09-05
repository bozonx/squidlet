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
  contentType: HttpContentType | undefined,
  fullBody: JsonTypes | Uint8Array
): string | Uint8Array | undefined {
  if (!contentType) return;

  switch (contentType) {
    case 'application/octet-stream':
      if (!(fullBody instanceof Uint8Array)) {
        throw new Error(
          `Incorrect body: it has to be instance of Uint8Array ` +
          `because content-type is "application/octet-stream:`
        );
      }

      return fullBody;
    case 'application/json':
      try {
        return JSON.stringify(fullBody);
      }
      catch(e) {
        throw new Error(
          `Incorrect body: content-type is application/json ` +
          `but body can't be converted to JSON`
        );
      }
    default:
      // other types such as text/plain, text/html and os on
      return String(fullBody);
  }
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
