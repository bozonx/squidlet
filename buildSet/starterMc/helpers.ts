//import * as fs from 'fs';
const fs = require('fs');


type StatResult = {dir: boolean};


export function isExists(fileOrDirPath: string): boolean {
  return Boolean(fs.statSync(fileOrDirPath));
}

export function eachFileRecursively(rootDir: string, cb: (pathToFile: string) => void): void {
  let currentDirs: string[] | undefined;

  try {
    currentDirs = fs.readdirSync(rootDir);
  }
  catch (err) {
    throw new Error(
      `Can't read dir "${rootDir}". Maybe it doesn't exist of you don't have FAT32 partition, ` +
      `in this case run: E.flashFatFS({ format: true });`
    );
  }

  // dir doesn't exists
  if (!currentDirs) return;

  // remove "." and ".."
  const preparedDirList = currentDirs.slice(2);

  for (let fileOrDir of preparedDirList) {
    const fileOrDirPath = `${rootDir}/${fileOrDir}`;
    const statResult: StatResult = fs.statSync(fileOrDirPath) as any;

    if (statResult.dir) {
      // it's dir - go recursively
      return eachFileRecursively(fileOrDirPath, cb);
    }

    // it's file
    cb(fileOrDirPath);
  }

}


// TODO: remake !!!!

export function makeModuleName(filePath: string, rootToRemove: string, newRoot: string): string {
  let result: string = filePath;
  const removedRoot: string[] = filePath.split(rootToRemove);

  if (removedRoot.length > 1) {
    // success
    result = removedRoot[1];
  }

  // remove extension
  result = result.replace(/\.js$/, '');

  return `${newRoot}${result}`;
}

export function includes(arr: any[], itemToFind: any) {
  return arr.indexOf(itemToFind) >= 0;
}
