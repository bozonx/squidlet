import LogLevel, {LOG_LEVELS} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/LogLevel.js';
import {compactUndefined} from '../../../../squidlet-lib/src/arrays';
import {EntityType, EntityTypePlural} from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityTypes.js';
import {JsonTypes, Primitives} from '../../../../squidlet-lib/src/interfaces/Types';


export function waitMs(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

// TODO: check tests
/**
 * Join topic paths using special path separator
 */
export function combineTopic(topicSeparator: string, ...subPaths: (string | undefined)[]): string {
  if (!subPaths.length) return '';

  return [ ...compactUndefined(subPaths) ].join(topicSeparator);
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
export function parseArgs(data?: Primitives): (JsonTypes | undefined)[] {
  const undefinedReplace = '!!!UNDEFINED!!!';

  if (typeof data === 'undefined') {
    return [];
  }
  else if (typeof data === 'number' || typeof data === 'boolean') {
    return [data];
  }
  else if (data === '') {
    return [];
  }
  // null, NaN case
  else if (!data) {
    return [data];
  }
  else if (typeof data !== 'string') {
    throw new Error(`Invalid data, it has to be a string. "${JSON.stringify(data)}"`);
  }

  const safeJson: string = data
    .replace(/undefined/, `"${undefinedReplace}"`)
    // add quotes to keys of object
    .replace(/({|,)\s*(.+?)\s*:/g, '$1 "$2":')
    // replace strings without quotes
    .split(`,`)
    .map((item: string) => {
      // TODO: it works badly with arrays and objects!!!!!
      const trimmed: string = item.trim();

      if (
        trimmed.match(/^[\]}]?true|false|null|undefined|NaN[\]}]?$/)
        || !trimmed.match(/^[a-zA-Z]/)
      ) {
        return item;
      }

      return `"${trimmed}"`;
    })
    .join(',');

  return JSON.parse(`[${safeJson}]`, (key: string, value: any) => {
    if (value === undefinedReplace) return undefined;

    return value;
  });
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
