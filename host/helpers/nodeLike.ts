const SEP = '/';


export function pathJoin (...paths: string[]): string {
  return paths.join(SEP);
}

// export function isAbsoluteFileName(fileName: string): boolean {
//   return fileName.indexOf('/') === 0 || fileName.indexOf('`') === 0;
// }
