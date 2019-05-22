import _difference = require('lodash/difference');


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
  const diff: string[] = _difference(hostIos, machineIos);

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
