import * as path from 'path';
import * as dependencyTree from 'dependency-tree';


export const PATH_SEPARATOR = '/';



export function stripExtension(filePath: string, extension: string): string {
  const regex = new RegExp(`\\.${extension}$`);

  return filePath.replace(regex, '');
}

export function stringify (moduleContent: string): string {
  let preparedContent = moduleContent || '';

  preparedContent = preparedContent.replace(/\\/g, '\\\\');
  preparedContent = preparedContent.replace(/\"/g, '\\"');
  preparedContent = preparedContent.replace(/\n/g, '\\n');
  preparedContent = preparedContent.replace(/\r/g, '\\r');
  // remove invisible and not ascii characters
  preparedContent = preparedContent.replace(/[^\x20-\x7E]+/g, '');

  return preparedContent;
}
//
// export function clearDir(dirName: string) {
//   shelljs.rm('-rf', path.join(dirName, '*'));
// }

export function makeSafeModuleName(fileName: string): string {
  return fileName.replace(/\//g, '|');
}

export function makeNormalModuleName(fileName: string): string {
  return fileName.replace(/\|/g, '/');
}

export function makeModuleCached(moduleName: string, moduleContent: string): string {
  return `Modules.addCached("${moduleName}", "${stringify(moduleContent)}")`;
}

// TODO: дублируется - наверное лучше взять из starterMc/helper.ts
export function makeModuleName(baseDir: string, moduleFullPath: string, moduleRoot: string): string {
  const strippedModuleName = stripExtension(moduleFullPath, 'js');
  const moduleRelPath = path.relative(baseDir, strippedModuleName);
  const moduleName = `${moduleRoot}${PATH_SEPARATOR}${moduleRelPath}`;

  return moduleName;
}

export function makeModulesTree(rootDir: string, relativeMainFile: string): string[] {
  return dependencyTree.toList({
    filename: path.join(rootDir, relativeMainFile),
    directory: rootDir,
    // exclude node_modules
    filter: (curPath: string) => curPath.indexOf('node_modules') === -1, // optional
  });
}
