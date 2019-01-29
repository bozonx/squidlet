import * as path from 'path';
import * as dependencyTree from 'dependency-tree';


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

  console.log(111111111, makeModulesTree)
}
