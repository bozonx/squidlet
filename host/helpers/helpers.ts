import {ALL_TOPICS} from '../dict/constants';
import systemConfig from '../config/systemConfig';
import {isEmpty} from './lodashLike';
import {Edge} from '../interfaces/dev/DigitalDev';


export const PATH_SEPARATOR = '/';


/**
 * Convert value like 'on', 'true', 1, true, ... to boolean
 */
export function convertToLevel(value: any): boolean {
  return value === true
    || value === 1
    || value === 'high'
    || value === 'true'
    || value === '1'
    || value === 'ON' || value === 'on' || value === 'On';
}

/**
 * Parse string numbers and constants to pure numbers and constants
 */
export function parseValue(rawValue: any): any {
  if (
    typeof rawValue === 'undefined'
    || rawValue === null
    || typeof rawValue === 'boolean'
    || Number.isNaN(rawValue)
    || rawValue === ''
  ) {
    return rawValue;
  }
  else if (rawValue === 'true') {
    return true;
  }
  else if (rawValue === 'false') {
    return false;
  }
  else if (rawValue === 'undefined') {
    return undefined;
  }
  else if (rawValue === 'null') {
    return null;
  }
  else if (rawValue === 'NaN') {
    return NaN;
  }
  // it is for - 2. strings
  else if (typeof rawValue === 'string' && rawValue.match(/^\d+\.$/)) {
    return rawValue;
  }

  const toNumber = parseFloat(rawValue);

  if (!Number.isNaN(toNumber)) {
    // it's number
    return toNumber;
  }

  if (typeof rawValue === 'string') {
    return rawValue;
  }

  // array or object - as is
  return rawValue;
}

/**
 * Is actually inverted.
 * Pullup inverts only if invertOnPullup is set.
 */
export function isDigitalInputInverted(invert: boolean, invertOnPullup: boolean, pullup?: boolean): boolean {
  // twice inverting on pullup if allowed
  if (pullup && invertOnPullup) {
    return !invert;
  }

  // in other cases - use invert prop
  return invert;
}

/**
 * It it needs to invert
 */
export function invertIfNeed(value: boolean, invert?: boolean): boolean {
  if (invert) return !value;

  return value;
}

/**
 * Resolve inverted edge.
 */
export function resolveEdge(edge: Edge | undefined, inverted?: boolean): Edge {
  if (!edge) {
    return 'both';
  }
  else if (inverted && edge === 'rising') {
    return 'falling';
  }
  else if (inverted && edge === 'falling') {
    return 'rising';
  }

  return edge;
}

/**
 * Turn only the first letter to upper case
 */
export function firstLetterToUpperCase(value: string): string {
  if (!value) return value;

  const split: string[] = value.split('');

  split[0] = split[0].toUpperCase();

  return split.join('');
}

/**
 * Call error-first callback functions like a promised
 */
export function callPromised(method: Function, ...params: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    method(...params, (err: Error, data: any) => {
      if (err) return reject(err);

      resolve(data);
    });
  });
}

/**
 * Join topic paths using special path separator
 */
export function combineTopic(basePath: string, ...subPaths: Array<string>): string {
  if (isEmpty(subPaths)) return basePath;

  return [ basePath, ...subPaths ].join(systemConfig.topicSeparator);
}

/**
 * Split topic like "id/sub/deeper" to [ 'id', 'sub/deeper' ]
 */
export function splitTopicId(topic: string): [ string, string | undefined ] {
  return splitFirstElement(topic, systemConfig.topicSeparator);
}

/**
 * Split first element of path using separator. 'path/to/dest' => [ 'path', 'to/dest' ]
 */
export function splitFirstElement(
  fullPath: string,
  separator: string
): [ string, string | undefined ] {
  if (!fullPath) throw new Error(`fullPath param is required`);
  if (!separator) throw new Error(`separator is required`);

  const split: string[] = fullPath.split(separator);
  const first: string = split[0];

  if (split.length === 1) {
    return [ fullPath, undefined ];
  }

  return [ first, split.slice(1).join(separator) ];
}

/**
 * Split last part of path. 'path/to/dest' => [ 'dest', 'path/to' ]
 */
export function splitLastElement(
  fullPath: string,
  separator: string
): [ string, string | undefined ] {
  if (!fullPath) throw new Error(`fullPath param is required`);
  if (!separator) throw new Error(`separator is required`);

  const split = fullPath.split(separator);
  const last: string = split[split.length - 1];

  if (split.length === 1) {
    return [ fullPath, undefined ];
  }

  // remove last element from path
  split.pop();

  return [ last, split.join(separator) ];
}

/**
 * Make combined event name which is used in host's event system.
 * makeEventName('cat', 'topic', 'name', 'otherName') => 'cat|topic|name|otherName'
 */
export function makeEventName(category: string, topic: string = ALL_TOPICS, ...others: Array<string>): string {
  return [ category, topic, ...others ].join(systemConfig.eventNameSeparator);
}



///////////////////// TODO test it



// // TODO: move to separate file
// export function validateMessage(message: Message) {
//   return message && message.category && message.topic && message.from && message.to;
// }

export function deferCall<T>(cb: () => any, delayMs: number): Promise<T> {
  // TODO: rerutn an object and add method - cancel
  return new Promise<T>((resolve, reject) => {
    setTimeout(async () => {
      try {
        resolve(await cb());
      }
      catch(err) {
        reject(err);
      }
    }, delayMs);
  });
}

// TODO: review
export function callOnDifferentValues(
  arr1: any[],
  arr2: any[],
  cb: (index: number, value1: any, value2: any) => void
) {
  for (let indexStr in arr1) {
    const index: number = parseInt(indexStr);

    if (arr1[index] !== arr2[index]) {
      cb(index, arr1[index], arr2[index]);
    }
  }
}

// export function isCorrectEdge(value: boolean, edge?: Edge): boolean {
//   if (!edge || edge === 'both') return true;
//   else if (value && edge === 'rising') return true;
//   else if (!value && edge === 'falling') return true;
//
//   return false;
// }
