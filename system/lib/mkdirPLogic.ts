import {PATH_SEPARATOR} from './helpers';
import {trimEnd} from './lodashLike';
import {pathDirname, pathBasename, pathIsAbsolute} from './paths';


export default async function mkdirPLogic (
  pathToDir: string,
  isDirExists: (dirName: string) => Promise<boolean>,
  mkdir: (dirName: string) => Promise<void>
): Promise<boolean> {
  if (!pathIsAbsolute(pathToDir)) {
    throw new Error(`path "${pathToDir}" has to be absolute`);
  }

  if (isDirExists(pathToDir)) return false;

  const preparedPath = trimEnd(pathToDir, PATH_SEPARATOR);

  // path parts from closest to further
  const pathParts: string[] = [];
  let existentBasePath: string = '/';

  function recursionFind(localPathToDir: string) {
    // TODO: why ~ - only absolute paths are supported
    //if (!localPathToDir || localPathToDir === PATH_SEPARATOR || localPathToDir === '~' || localPathToDir === `~${PATH_SEPARATOR}`) {
    // skip root path
    if (!localPathToDir || localPathToDir === PATH_SEPARATOR) {
      return;
    }
    else if (isDirExists(localPathToDir)) {
      existentBasePath = localPathToDir;

      // finish of finding
      return;
    }
    else {
      // split path
      const shorterPath = pathDirname(localPathToDir);
      const lastPart = pathBasename(localPathToDir);

      pathParts.push(lastPart);

      // go deeper
      recursionFind(shorterPath);
    }
  }

  recursionFind(preparedPath);

  // TODO: why return false??
  //if (!existentBasePath) return false;

  // create paths
  for (let pathIndex in pathParts.reverse()) {
    const pathPart = pathParts.slice(0, parseInt(pathIndex) + 1)
      .join(PATH_SEPARATOR);
    const fullPath = `${existentBasePath}${PATH_SEPARATOR}${pathPart}`;

    mkdir(fullPath);
  }

  return true;
}
