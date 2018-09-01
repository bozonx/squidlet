import * as path from 'path';


export default async function mkdirPLogic (
  pathToDir: string,
  isDirExists: (dirName: string) => Promise<boolean>,
  mkdir: (dirName: string) => Promise<void>
) {
  if (await isDirExists(pathToDir)) return;

  // TODO: !принимать только абсолюбные пути
  // TODO: поддержка последнего слэша
  // TODO: ищем рекурсивно ближайший не созданный путь и собираем пути до него

  // path parts from closest to further
  const pathParts: string[] = [];
  let existentBasePath: string = '';

  async function recursionFind(localPathToDir: string) {
    if (await isDirExists(localPathToDir)) {
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

  await recursionFind(pathToDir);


  for (let pathIndex in pathParts) {
    const pathPart = pathParts.slice(0, pathIndex as any)
      .join(path.delimiter);
    const fullPath = path.join(existentBasePath, pathPart);
    console.log(1111111, pathParts, pathPart, fullPath, path.delimiter);

    await mkdir(fullPath);
  }

}
