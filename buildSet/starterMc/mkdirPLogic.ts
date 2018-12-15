import _trimEnd = require('lodash/trimEnd');
import * as path from 'path';


// TODO: it's duplicate of host/helpers/mkdirPLogic.ts


export default async function mkdirPLogic (
  pathToDir: string,
  isDirExists: (dirName: string) => Promise<boolean>,
  mkdir: (dirName: string) => Promise<void>
): Promise<boolean> {
  if (!path.isAbsolute(pathToDir)) {
    throw new Error(`path "${pathToDir}" has to be absolute`);
  }

  if (await isDirExists(pathToDir)) return false;

  const preparedPath = _trimEnd(pathToDir, path.sep);

  // path parts from closest to further
  const pathParts: string[] = [];
  let existentBasePath: string = '';

  async function recursionFind(localPathToDir: string) {
    if (!localPathToDir || localPathToDir === path.sep || localPathToDir === '~' || localPathToDir === `~${path.sep}`) {
      return;
    }
    else if (await isDirExists(localPathToDir)) {
      existentBasePath = localPathToDir;

      // finish of finding
      return;
    }
    else {
      // split path
      const shorterPath = path.dirname(localPathToDir);
      const lastPart = path.basename(localPathToDir);

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
      .join(path.sep);
    const fullPath = path.join(existentBasePath, pathPart);

    await mkdir(fullPath);
  }

  return true;
}
