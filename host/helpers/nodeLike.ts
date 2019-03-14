const SEP = '/';


export function pathJoin (...paths: string[]): string {
  const prepared: string[] = [];

  for (let i = 0; i < paths.length; i++) {
    if (i === 0) {
      prepared.push(paths[i]);
    }
    else {
      prepared.push(paths[i].replace(/^\//, ''));
    }
  }

  return prepared.join(SEP);
}

// export function isAbsoluteFileName(fileName: string): boolean {
//   return fileName.indexOf('/') === 0 || fileName.indexOf('`') === 0;
// }
