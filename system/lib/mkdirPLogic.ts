import {pathDirname, pathBasename, pathIsAbsolute, PATH_SEP} from './paths';
import {trimCharEnd} from './strings';


export default async function mkdirPLogic (
  pathToDir: string,
  isDirExists: (dirName: string) => Promise<boolean>,
  mkdir: (dirName: string) => Promise<void>
): Promise<boolean> {
  if (!pathIsAbsolute(pathToDir)) {
    throw new Error(`path "${pathToDir}" has to be absolute`);
  }

  if (isDirExists(pathToDir)) return false;

  const preparedPath = trimCharEnd(pathToDir, PATH_SEP);

  // path parts from closest to further
  const pathParts: string[] = [];
  let existentBasePath: string = '/';

  function recursionFind(localPathToDir: string) {
    // TODO: why ~ - only absolute paths are supported
    //if (!localPathToDir || localPathToDir === PATH_SEP || localPathToDir === '~' || localPathToDir === `~${PATH_SEP}`) {
    // skip root path
    if (!localPathToDir || localPathToDir === PATH_SEP) {
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
      .join(PATH_SEP);
    const fullPath = `${existentBasePath}${PATH_SEP}${pathPart}`;

    mkdir(fullPath);
  }

  return true;
}
