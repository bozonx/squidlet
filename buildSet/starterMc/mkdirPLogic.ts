
// TODO: it's duplicate of host/helpers/mkdirPLogic.ts

const _trimEnd = require('lodash/trimEnd');


const PATH_SEPARATOR = '/';


export function isAbsolutePath(pathToDirOrFile: string): boolean {
  return Boolean(pathToDirOrFile.match(/^\//));
}

export function dirname(pathToDirOrFile: string): string {
  const pathParts: string[] = pathToDirOrFile.split(PATH_SEPARATOR);

  pathParts.pop();

  return pathParts.join(PATH_SEPARATOR);
}

export function basename(pathToDirOrFile: string): string {
  const pathParts: string[] = pathToDirOrFile.split(PATH_SEPARATOR);

  return pathParts[pathParts.length - 1];
}


export default function mkdirPLogic (
  pathToDir: string,
  isDirExists: (dirName: string) => boolean,
  mkdir: (dirName: string) => void
): boolean {
  if (!isAbsolutePath(pathToDir)) {
    throw new Error(`path "${pathToDir}" has to be absolute`);
  }

  if (isDirExists(pathToDir)) return false;

  const preparedPath = _trimEnd(pathToDir, PATH_SEPARATOR);

  // path parts from closest to further
  const pathParts: string[] = [];
  let existentBasePath: string = '';

  function recursionFind(localPathToDir: string) {
    if (!localPathToDir || localPathToDir === PATH_SEPARATOR || localPathToDir === '~' || localPathToDir === `~${PATH_SEPARATOR}`) {
      return;
    }
    else if (isDirExists(localPathToDir)) {
      existentBasePath = localPathToDir;

      // finish of finding
      return;
    }
    else {
      // split path
      const shorterPath = dirname(localPathToDir);
      const lastPart = basename(localPathToDir);

      pathParts.push(lastPart);

      // go deeper
      recursionFind(shorterPath);
    }
  }

  recursionFind(preparedPath);


  if (!existentBasePath) return false;

  // create paths
  for (let pathIndex in pathParts.reverse()) {
    const pathPart = pathParts.slice(0, parseInt(pathIndex) + 1)
      .join(PATH_SEPARATOR);
    const fullPath = `${existentBasePath}${PATH_SEPARATOR}${pathPart}`;

    mkdir(fullPath);
  }

  return true;
}
