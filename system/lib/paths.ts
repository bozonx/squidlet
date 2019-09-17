import {PATH_SEPARATOR} from './helpers';
import {trimCharEnd} from './strings';


export const PATH_SEP = '/';


/**
 * Join paths.
 * pathJoin('/path/', '/to/', './dir') => '/path/to/./dir'
 */
export function pathJoin (...paths: string[]): string {
  const prepared: string[] = [];

  for (let i = 0; i < paths.length; i++) {
    let cleared: string;

    if (typeof paths[i] !== 'string') {
      throw new Error(`pathJoin: paths have to be strings`);
    }
    else if (i === 0) {
      const regexp = `\\${PATH_SEP}$`;

      cleared = paths[i].replace(new RegExp(regexp), '');
    }
    else {
      const regexp = `^\\${PATH_SEP}(.+)\\${PATH_SEP}$`;

      cleared = paths[i].replace(new RegExp(regexp), '$1');
    }

    prepared.push(cleared);
  }

  return prepared.join(PATH_SEP);
}

export function pathIsAbsolute(pathToDirOrFile: string): boolean {
  if (typeof pathToDirOrFile !== 'string') {
    throw new Error(`pathIsAbsolute: path has to be a string`);
  }

  return pathToDirOrFile.indexOf('/') === 0 || pathToDirOrFile.indexOf('~') === 0;
}

export function pathDirname(pathToDirOrFile: string): string {
  const pathParts: string[] = trimCharEnd(pathToDirOrFile, PATH_SEP).split(PATH_SEPARATOR);

  pathParts.pop();

  return pathParts.join(PATH_SEPARATOR);
}

export function pathBasename(pathToDirOrFile: string): string {
  const pathParts: string[] = pathToDirOrFile.split(PATH_SEPARATOR);

  return pathParts[pathParts.length - 1];
}
