import * as path from 'path';
import * as dependencyTree from 'dependency-tree';
import * as shelljs from 'shelljs';


export function makeModulesTree(rootDir: string, relativeMainFile: string): string[] {
  return dependencyTree.toList({
    filename: path.join(rootDir, relativeMainFile),
    directory: rootDir,
    // exclude node_modules
    filter: (curPath: string) => curPath.indexOf('node_modules') === -1, // optional
  });
}

export default async function modulesTree (srcDir: string, dstDir: string, relativeMainFile: string = 'index.js') {
  const modulesFileNames = makeModulesTree(srcDir, relativeMainFile);

  for (let absFileName of modulesFileNames) {
    const relFilePathPath = path.relative(srcDir, absFileName);
    const dstFileDir = path.join(dstDir, path.dirname(relFilePathPath));

    shelljs.mkdir('-p', dstFileDir);
    shelljs.cp(absFileName, dstFileDir);
  }
}
