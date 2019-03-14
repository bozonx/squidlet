import {PATH_SEPARATOR} from './helpers';

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

export function isAbsolutePath(pathToDirOrFile: string): boolean {
  return Boolean(pathToDirOrFile.match(/^\//));
  //return fileName.indexOf('/') === 0 || fileName.indexOf('`') === 0;
}

export function pathDirname(pathToDirOrFile: string): string {
  const pathParts: string[] = pathToDirOrFile.split(PATH_SEPARATOR);

  pathParts.pop();

  return pathParts.join(PATH_SEPARATOR);
}

export function pathBasename(pathToDirOrFile: string): string {
  const pathParts: string[] = pathToDirOrFile.split(PATH_SEPARATOR);

  return pathParts[pathParts.length - 1];
}
