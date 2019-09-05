import {JsonTypes} from '../interfaces/Types';


export type HttpContentType = 'text/plain'
  | 'text/html'
  | 'application/json'
  | 'application/javascript'
  | 'application/xml'
  | 'application/octet-stream';

const STRING_CONTENT_TYPES = ['text/plain', 'text/html', 'application/javascript', 'application/xml'];


/**
 * Parse request's body. It should correspond to content-type header.
 * But if content-type isn't supported then body will be used as is.
 */
export function parseBody(contentType?: HttpContentType, body?: string | Uint8Array): JsonTypes | Uint8Array {
  if (!contentType) return;

  if (contentType === 'application/octet-stream') {
    if (!(body instanceof Uint8Array)) {
      throw new Error(
        `parseBody: Incorrect body: it has to be instance of Uint8Array ` +
        `because content-type is "application/octet-stream:`
      );
    }

    return body;
  }
  else if (contentType === 'application/json') {
    if (typeof body !== 'string') {
      throw new Error(
        `parseBody: Incorrect body: content-type is "application/json" ` +
        `and body has to be a string`
      );
    }

    try {
      return JSON.parse(body);
    }
    catch(e) {
      throw new Error(
        `parseBody: Incorrect body: content-type is "application/json" ` +
        `but body can't convert JSON to js`
      );
    }
  }
  else if (STRING_CONTENT_TYPES.includes(contentType)) {
    if (typeof body !== 'string') {
      throw new Error(
        `parseBody: Incorrect body: content-type is "${contentType}" ` +
        `and body has to be a string`
      );
    }

    return body;
  }

  // return as is
  return body;
}

/**
 * Prepare body to response
 */
export function prepareBody(
  contentType: HttpContentType | undefined,
  fullBody: JsonTypes | Uint8Array
): string | Uint8Array | undefined {
  if (!contentType) {
    if (typeof fullBody !== 'undefined') {
      throw new Error(`prepareBody: Incorrect body: no content-type and body has to be undefined`);
    }

    return;
  }

  switch (contentType) {
    case 'application/octet-stream':
      if (!(fullBody instanceof Uint8Array)) {
        throw new Error(
          `prepareBody: Incorrect body: it has to be instance of Uint8Array ` +
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
          `prepareBody: Incorrect body: content-type is application/json ` +
          `but body can't be converted to JSON`
        );
      }
    default:

      // TODO: проверить json, text/hteml, javascript, xml что это string - остальное как есть

      // other types such as text/plain, text/html and os on
      return fullBody;
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
