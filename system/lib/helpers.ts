import {Edge} from '../interfaces/io/DigitalIo';
import LogLevel, {LOG_LEVELS} from '../interfaces/LogLevel';
import {compactUndefined, isEqualArrays} from './arrays';
import {EntityType, EntityTypePlural} from '../interfaces/EntityTypes';
import {JsonTypes, Primitives} from '../interfaces/Types';
import {parseValue} from './common';
import {isEqualUint8Array} from './binaryHelpers';
import {isEqualObjects} from './objects';


export function isEqual(first: any, second: any): boolean {
  if (typeof first !== 'object' || typeof second !== 'object') {
    return first === second;
  }

  else if (first instanceof Uint8Array || second instanceof Uint8Array) {
    return isEqualUint8Array(first, second);
  }
  else if (Array.isArray(first) || Array.isArray(second)) {
    return isEqualArrays(first, second);
  }
  // plain objects and instances
  else if (typeof first === 'object' || typeof second === 'object') {
    return isEqualObjects(first, second);
  }

  // for the any other case e.g null
  return JSON.stringify(first) === JSON.stringify(second);
}

/**
 * Convert value like 'on', 'true', 1, true, ... to boolean
 */
export function resolveLevel(value: any): boolean {
  return value === true
    || value === 1
    || value === 'high'
    || value === 'true'
    || value === '1'
    || value === 'ON' || value === 'on' || value === 'On';
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
 * Join topic paths using special path separator
 */
export function combineTopic(topicSeparator: string, basePath: string, ...subPaths: Array<string | undefined>): string {
  if (!subPaths.length) return basePath;

  return [ basePath, ...compactUndefined(subPaths) ].join(topicSeparator);
}

/**
 * Makes ['info', 'warn', 'error'] if log level is 'info'
 */
export function calcAllowedLogLevels(logLevel: LogLevel): LogLevel[] {
  const currentLevelIndex: number = LOG_LEVELS.indexOf(logLevel);

  return LOG_LEVELS.slice(currentLevelIndex) as LogLevel[];
}

/**
 * Collect values which are set in default param of props schema
 */
export function collectPropsDefaults(manifestProps?: {[index: string]: any}): {[index: string]: any} {
  const result: {[index: string]: any} = {};

  if (!manifestProps) return result;

  for (let propName of Object.keys(manifestProps)) {
    if (!manifestProps[propName] || typeof manifestProps[propName].default === 'undefined') continue;

    result[propName] = manifestProps[propName].default;
  }

  return result;
}

export function convertEntityTypeToPlural(entityType: EntityType): EntityTypePlural {
  return `${entityType}s` as any;
}

/**
 * Parse comma separated args like: param1,5,true to ['param1', 5, true];
 */
export function parseArgs(data: Primitives | undefined): JsonTypes[] {
  if (typeof data === 'undefined') {
    return [];
  }
  else if (typeof data === 'number' || typeof data === 'boolean') {
    return [data];
  }
  else if (typeof data !== 'string') {
    throw new Error(`Invalid data, it has to be a string. "${JSON.stringify(data)}"`);
  }

  // TODO: support of array and objects
  const splat: string[] = data.split(',');
  const result: JsonTypes[] = [];

  for (let item of splat) {
    const trimmed = item.trim();

    // remove quotes
    if (trimmed.match(/^'.+'$/) || trimmed.match(/^".+"$/)) {
      result.push(trimmed.replace(/^['"](.+)['"]$/, '$1'));

      continue;
    }

    result.push( parseValue(trimmed.trim()) );
  }

  return result;
}

// TODO: review
// TODO: test
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
// TODO: test
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

export function consoleError(msg: string) {
  console.error(`ERROR: ${msg}`);
}

// /**
//  * Split topic like "id/sub/deeper" to [ 'id', 'sub/deeper' ]
//  */
// export function splitTopicId(topicSeparator: string, topic: string): [ string, string | undefined ] {
//   return splitFirstElement(topic, topicSeparator);
// }

// export function isCorrectEdge(value: boolean, edge?: Edge): boolean {
//   if (!edge || edge === 'both') return true;
//   else if (value && edge === 'rising') return true;
//   else if (!value && edge === 'falling') return true;
//
//   return false;
// }

// export function validateMessage(message: Message) {
//   return message && message.category && message.topic && message.from && message.to;
// }
