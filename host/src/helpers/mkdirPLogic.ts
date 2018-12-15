import _trimEnd = require('lodash/trimEnd');
import {PATH_SEPARATOR, dirname, basename, isAbsolutePath} from './helpers';


export default async function mkdirPLogic (
  pathToDir: string,
  isDirExists: (dirName: string) => Promise<boolean>,
  mkdir: (dirName: string) => Promise<void>
): Promise<boolean> {
  if (!isAbsolutePath(pathToDir)) {
    throw new Error(`path "${pathToDir}" has to be absolute`);
  }

  if (await isDirExists(pathToDir)) return false;

  const preparedPath = _trimEnd(pathToDir, PATH_SEPARATOR);

  // path parts from closest to further
  const pathParts: string[] = [];
  let existentBasePath: string = '';

  async function recursionFind(localPathToDir: string) {
    if (!localPathToDir || localPathToDir === PATH_SEPARATOR || localPathToDir === '~' || localPathToDir === `~${PATH_SEPARATOR}`) {
      return;
    }
    else if (await isDirExists(localPathToDir)) {
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
      await recursionFind(shorterPath);
    }
  }

  await recursionFind(preparedPath);


  if (!existentBasePath) return false;

  // create paths
  for (let pathIndex in pathParts.reverse()) {
    const pathPart = pathParts.slice(0, parseInt(pathIndex) + 1)
      .join(PATH_SEPARATOR);
    const fullPath = `${existentBasePath}${PATH_SEPARATOR}${pathPart}`;

    await mkdir(fullPath);
  }

  return true;
}
