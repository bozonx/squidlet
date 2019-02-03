// export function isAbsoluteFileName(fileName: string): boolean {
//   return fileName.indexOf('/') === 0 || fileName.indexOf('`') === 0;
// }

import * as path from 'path';
import {Stats} from '../host/interfaces/dev/Storage';


export function appendArray<T>(srcArr: T[], arrToAppend?: T[]) {
  if (!arrToAppend) return;

  for (let item of arrToAppend) srcArr.push(item);
}

export function sortByIncludeInList(itemsToSearch: string[], listToSearchIn: string[]): [string[], string[]] {
  const included: string[] = [];
  const notIncluded: string[] = [];

  for (let item of itemsToSearch) {
    if (listToSearchIn.indexOf(item) >= 0) {
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
