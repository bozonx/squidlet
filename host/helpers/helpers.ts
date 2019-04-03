import {ALL_TOPICS} from '../dict/constants';
import systemConfig from '../config/systemConfig';
import {isEmpty} from './lodashLike';
import {Edge} from '../interfaces/dev/DigitalDev';


export const PATH_SEPARATOR = '/';


export function convertToLevel(value: any): boolean {
  return value === true
    || value === 1
    || value === 'high'
    || value === 'true'
    || value === '1'
    || value === 'ON' || value === 'on' || value === 'On';
}

export function parseValue(rawValue: any): any {
  if (typeof rawValue === 'undefined') {
    return;
  }
  if (rawValue === null) {
    return null;
  }
  else if (typeof rawValue === 'boolean') {
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
  else if (Number.isNaN(rawValue)) {
    return NaN;
  }
  else if (rawValue === 'NaN') {
    return NaN;
  }
  else if (rawValue === '') {
    return '';
  }
  // it is for - 2. strings
  else if (typeof rawValue === 'string' && rawValue.match(/^\d+\.$/)) {
    return rawValue;
  }

  const toNumber = Number(rawValue);

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

export function isDigitalInputInverted(invert: boolean, invertOnPullup: boolean, pullup?: boolean): boolean {
  // twice inverting on pullup if allowed
  if (pullup && invertOnPullup) {
    return !invert;
  }

  // in other cases - use invert prop
  return invert;
}

export function callPromised(method: Function, ...params: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    method(...params, (err: Error, data: any) => {
      if (err) return reject(err);

      resolve(data);
    });
  });
}

export function firstLetterToUpperCase(value: string): string {
  if (!value) return value;

  const split: string[] = value.split('');

  split[0] = split[0].toUpperCase();

  return split.join('');
}

export function invertIfNeed(value: boolean, invert?: boolean): boolean {
  if (invert) return !value;

  return value;
}

export function resolveEdge(edge: Edge | undefined, inverted?: boolean): Edge {

  // TODO: test

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


export function generateEventName(category: string, topic: string = ALL_TOPICS, ...others: Array<string>): string {

  // TODO: test

  return [ category, topic, ...others ].join(systemConfig.eventNameSeparator);
}

export function combineTopic(basePath: string, ...subPaths: Array<string>): string {

  // TODO: test

  if (isEmpty(subPaths)) return basePath;

  return [ basePath, ...subPaths ].join(systemConfig.topicSeparator);
}

export function splitTopic(topic: string): { id: string, subTopic: string } {

  // TODO: test

  const { first, rest } = splitFirstElement(topic, systemConfig.topicSeparator);

  return {
    id: first,
    subTopic: rest,
  };
}

export function splitFirstElement(
  fullPath: string,
  separator: string
): { first: string, rest: string } {

  // TODO: test

  if (!fullPath) throw new Error(`fullPath param is empty`);

  const split: string[] = fullPath.split(separator);
  const first: string = split[0];

  return {
    first,
    rest: split.slice(1).join(separator),
  };
}

export function splitLastElement(
  fullPath: string,
  separator: string
): { last: string, rest: string | undefined } {

  // TODO: review
  // TODO: test

  if (!fullPath) throw new Error(`fullPath param is empty`);

  const split = fullPath.split(separator);
  const last: string = split[split.length - 1];

  if (split.length === 1) {
    return {
      last: fullPath,
      rest: undefined,
    };
  }

  // remove last element from path
  split.pop();

  return {
    last,
    rest: split.join(separator),
  };
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
