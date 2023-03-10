import {JsonTypes} from '../interfaces/Types';
import {HttpContentType} from '../interfaces/Http';


// TODO: does it need support of null????


const STRING_CONTENT_TYPES = ['text/plain', 'application/javascript', 'application/xml'];


export function isHtml(str: any): boolean {
  if (typeof str !== 'string') return false;

  return Boolean(str.match(/^\s*<!DOCTYPE\s+html/i));
}

/**
 * Parse request's body. It should correspond to content-type header.
 * But if content-type isn't supported then body will be used as is.
 */
export function parseBody(
  contentType?: HttpContentType,
  body?: string | Uint8Array
): JsonTypes | Uint8Array | undefined {
  if (!contentType) {
    if (typeof body !== 'undefined') {
      throw new Error(`parseBody: Incorrect body: no content-type and body has to be undefined`);
    }

    return;
  }

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
  else if (contentType === 'text/html') {
    if (!isHtml(body)) {
      throw new Error(
        `parseBody: Incorrect body: content-type is "text/html" but body isn't a html`
      );
    }

    return body;
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

  // return as is for other types
  return body;
}

/**
 * Prepare body to response
 */
export function prepareBody(
  contentType: HttpContentType | undefined,
  fullBody?: JsonTypes | Uint8Array
): string | Uint8Array | undefined {
  if (!contentType) {
    if (typeof fullBody !== 'undefined') {
      throw new Error(`prepareBody: Incorrect body: no content-type and body has to be undefined`);
    }

    return;
  }

  if (contentType === 'application/octet-stream') {
    if (!(fullBody instanceof Uint8Array)) {
      throw new Error(
        `prepareBody: Incorrect body: it has to be instance of Uint8Array ` +
        `because content-type is "application/octet-stream:`
      );
    }

    return fullBody;
  }
  else if (contentType === 'application/json') {
    if (typeof fullBody === 'undefined') {
      throw new Error(`prepareBody: Incorrect body: content-type is application/json but it is undefined`);
    }

    try {
      return JSON.stringify(fullBody);
    }
    catch(e) {
      throw new Error(
        `prepareBody: Incorrect body: content-type is application/json ` +
        `but body can't be converted to JSON`
      );
    }
  }
  else if (contentType === 'text/html') {
    if (!isHtml(fullBody)) {
      throw new Error(
        `prepareBody: Incorrect body: content-type is "text/html" but body isn't a html`
      );
    }

    return fullBody as string;
  }
  else if (STRING_CONTENT_TYPES.includes(contentType)) {
    if (typeof fullBody !== 'string') {
      throw new Error(
        `prepareBody: Incorrect body: content-type is "${contentType}" ` +
        `and body has to be a string`
      );
    }

    return fullBody;
  }

  // return as is for other types
  return fullBody as any;
}

/**
 * Resolve body type which will be prepared in prepareBody() and sent. Logic
 * * undefined => undefined
 * * Uint8Array => application/octet-stream
 * * has "doctype html" => text/html
 * * string
 * * number, boolean, null, [] or {} => application/json
 */
export function resolveBodyType(fullBody?: JsonTypes | Uint8Array): HttpContentType | undefined {
  if (typeof fullBody === 'undefined') {
    return;
  }
  else if (fullBody instanceof Uint8Array) {
    return 'application/octet-stream';
  }
  else if (typeof fullBody === 'string') {
    if (isHtml(fullBody)) return 'text/html';

    return 'text/plain';
  }

  // number, boolean, null, [] or {}
  return 'application/json';
}
