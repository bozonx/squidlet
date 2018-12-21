import * as path from 'path';
import * as shelljs from 'shelljs';
import * as dependencyTree from 'dependency-tree';


export const PATH_SEPARATOR = '/';


interface BuildConfig {
  buildDir: string;
  compiledTsDir: string;
  compiledJsDir: string;
  moduleRoot: string;
  minPrjDir: string;
  minDepsDir: string;
  flashDir: string;
  srcDir: string;
  dependenciesBuildDir: string;
  mainJsFileName: string;
  bundleFile: string;
  prjConfigYaml: string;
  strictMode?: boolean;
}



export function stripExtension(filePath: string, extension: string): string {
  const regex = new RegExp(`\\.${extension}$`);

  return filePath.replace(regex, '');
}

export function stringify (moduleContent: string): string {
  let preparedContent = moduleContent || '';

  preparedContent = preparedContent.replace(/\\/g, '\\\\');
  preparedContent = preparedContent.replace(/\"/g, '\\"');
  preparedContent = preparedContent.replace(/\n/g, '\\n');

  return preparedContent;
}

export function projectConfig(envPrjConfig: {[index: string]: any}): BuildConfig {

  // TODO: корень build dir получить из аргументов

  const buildDir = path.resolve(process.cwd(), envPrjConfig.dst);

  return {
    buildDir,
    compiledTsDir: path.join(buildDir, 'compiled-ts'),
    compiledJsDir: path.join(buildDir, 'compiled-js'),
    moduleRoot: envPrjConfig.moduleRoot,
    minPrjDir: path.join(buildDir, 'minPrj'),
    minDepsDir: path.join(buildDir, 'minDeps'),
    flashDir: path.join(buildDir, 'flash'),
    srcDir: path.resolve(process.cwd(), envPrjConfig.src),
    dependenciesBuildDir: path.join(buildDir, 'deps'),
    mainJsFileName: `${envPrjConfig.main}.js`,
    bundleFile: path.join(buildDir, 'bundle.js'),
    prjConfigYaml: envPrjConfig.prjConfig,
    strictMode: envPrjConfig.strictMode,
  };
}

export function clearDir(dirName: string) {
  shelljs.rm('-rf', path.join(dirName, '*'));
}

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
