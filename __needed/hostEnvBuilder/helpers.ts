import {EntityType, EntityTypePlural} from '../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityTypes.js';
import {arraysDifference} from '../../../squidlet-lib/src/arrays';


/**
 * Return two arrays [included[], notIncluded[]].
 * @param wholeSet - all items
 * @param targetItems - target items which will be in "included" array
 */
export function sortByIncludeInList(wholeSet: string[], targetItems: string[]): [string[], string[]] {
  const included: string[] = [];
  const notIncluded: string[] = [];

  for (let item of wholeSet) {
    if (targetItems.indexOf(item) >= 0) {
      included.push(item);
    }
    else {
      notIncluded.push(item);
    }
  }

  return [
    included,
    notIncluded,
  ];
}

export function checkIoExistance(hostIos: string[], machineIos: string[]) {
  const diff: string[] = arraysDifference(hostIos, machineIos);

  if (diff.length) {
    throw new Error(`There aren't some IO "${JSON.stringify(diff)}" in the selected platform`);
  }
}

/**
 * Remove "./" and "../" from the path.
 * e.g '../rel/../to' => 'rel/to'
 */
export function clearRelativePath(rawPath: string): string {
  return rawPath.replace(/\.{1,2}\//g, '');
}

export function convertEntityTypePluralToSingle(entityTypePlural: EntityTypePlural): EntityType {
  return entityTypePlural.slice(0, -1) as any;
}

// export function yamlToJs(yamlString: string): any {
//
//   return yaml.safeLoad(yamlString);
//
//   // // remove empty params
//   //
//   // // TODO: tabs convert to 2 spaces ???
//   //
//   // const regexp = /( *)[^\n\r\s]+\s*:s*\n+(( *)[^\n\r\s]*)/g;
//   // const replCb = (
//   //   substring: string,
//   //   spacesFirst: string,
//   //   rest: string,
//   //   spaceslLast: string,
//   //   ...args: any[]
//   // ): string => {
//   //   console.log(111111111, substring, spacesFirst, spaceslLast, rest, args);
//   //
//   //   if (spacesFirst.length >= spaceslLast.length) return rest;
//   //
//   //   return substring;
//   // };
//   //
//   // let cleared: string = yamlString.replace(regexp, replCb);
//   // // 4 nested levels are supported
//   // // cleared = cleared.replace(regexp, replCb);
//   // // cleared = cleared.replace(regexp, replCb);
//   // // cleared = cleared.replace(regexp, replCb);
//   //   // the last one
//   // cleared = cleared.replace(/ *[^\n\r\s]+\s*:\s*$/, '');
//   //
//   // console.log(22222222, cleared)
//   //
//   // return yaml.safeLoad(cleared);
// }
