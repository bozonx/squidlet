import {trimChar, trimCharEnd, trimCharStart} from './strings';


export const PATH_SEP = '/';


/**
 * Join paths.
 * pathJoin('/path/', '/to/', './dir') => '/path/to/./dir'.
 * It clears doubling of delimiters
 */
export function pathJoin (...paths: string[]): string {
  const prepared: string[] = [];

  for (let i = 0; i < paths.length; i++) {
    let cleared: string;

    if (typeof paths[i] !== 'string') {
      throw new Error(`pathJoin: paths have to be strings`);
    }
    else if (i === 0) {
      // the first one - clear right delimiter
      cleared = trimCharEnd(paths[i], PATH_SEP);
    }
    else if (i === (paths.length -1)) {
      // the right one - clear left delimiter
      cleared = trimCharStart(paths[i], PATH_SEP);
    }
    else {
      // in the middle - clear both delimiters
      cleared = trimChar(paths[i], PATH_SEP);
    }

    prepared.push(cleared);
  }

  return prepared
    .filter((item) => Boolean(item))
    .join(PATH_SEP);
}

export function pathIsAbsolute(pathToDirOrFile: string): boolean {
  if (typeof pathToDirOrFile !== 'string') {
    throw new Error(`pathIsAbsolute: path has to be a string`);
  }

  return pathToDirOrFile.indexOf('/') === 0 || pathToDirOrFile.indexOf('~') === 0;
}

export function pathDirname(pathToDirOrFile: string): string {
  const pathParts: string[] = trimCharEnd(pathToDirOrFile, PATH_SEP).split(PATH_SEP);

  pathParts.pop();

  return pathParts.join(PATH_SEP);
}

export function pathBasename(pathToDirOrFile: string): string {
  const pathParts: string[] = pathToDirOrFile.split(PATH_SEP);

  return pathParts[pathParts.length - 1];
}
