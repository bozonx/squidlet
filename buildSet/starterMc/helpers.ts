//import * as fs from 'fs';
const fs = require('fs');


type StatResult = {dir: boolean};


export function eachFileRecursively(rootDir: string, cb: (pathToFile: string) => void): void {
  const currentDirs: string[] | undefined = fs.readdirSync(rootDir);
  
  // dir doesn't exists
  if (!currentDirs) return;

  for (let fileOrDir of currentDirs) {
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

export function makeModuleName(filePath: string, rootToRemove: string, newRoot: string): string {
  let result: string = filePath;
  const removedRoot: string[] = filePath.split(rootToRemove);

  if (removedRoot.length > 0) {
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
