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
export function prepareBody(fullBoby: JsonTypes | Uint8Array): string | Uint8Array | undefined {

  // TODO: body - если object - то JSON.stringify
  // TODO: атоматом сделать JSON.stringify
  // TODO: атоматом установить content-type

}

export function resolveBodyType(): HttpContentType {
  // TODO: add !!!!
}
