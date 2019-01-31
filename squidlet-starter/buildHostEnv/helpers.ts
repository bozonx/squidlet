// export function isAbsoluteFileName(fileName: string): boolean {
//   return fileName.indexOf('/') === 0 || fileName.indexOf('`') === 0;
// }

import * as path from 'path';
import {Stats} from '../../host/interfaces/dev/Storage';


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

// TODO: maybe move to register?
export async function resolveIndexFile(
  stat: (path: string) => Promise<Stats>,
  exists: (path: string) => Promise<boolean>,
  pathToDirOrFile: string,
  indexFileNames: string[]
): Promise<string> {
  if (!(await stat(pathToDirOrFile)).dir) {
    // if it's file - return it
    return pathToDirOrFile;
  }
  // else it is dir

  for (let indexFile of indexFileNames) {
    const fullPath = path.join(pathToDirOrFile, indexFile);

    if (exists(fullPath)) {
      return fullPath;
    }
  }

  throw new Error(`Can't resolve index file "${pathToDirOrFile}"`);
}
