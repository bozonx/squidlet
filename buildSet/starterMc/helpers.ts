import * as fs from 'fs';


export function eachFileRecursively(rootDir: string, cb: (pathToFile: string) => void) {
  // TODO: add
  // TODO: проверить что папка существует и есть файлы

  const dirs: string[] = fs.readdirSync(rootDir);
}

export function makeModuleName(filePath: string, removeRoot: string, newRoot: string): string {
  // TODO: add

  let result: string = filePath;
  const removedRoot: string[] = filePath.split(removeRoot);

  if (removeRoot.length > 0) {
    // success
    result = removeRoot[1];
  }

  return `${newRoot}${result}`;
}
