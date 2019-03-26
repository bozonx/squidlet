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

export function checkDevsExistance(hostDevs: string[], machineDevs: string[]) {
  const diff: string[] = _difference(hostDevs, machineDevs);

  if (diff.length) {
    throw new Error(`There aren't some devs "${JSON.stringify(diff)}" in the selected platform`);
  }
}
