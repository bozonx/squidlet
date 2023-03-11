import * as path from 'path';
import * as dependencyTree from 'dependency-tree';


const PATH_SEPARATOR = '/';


interface BuildConfig {
  buildDir: string;
  compiledTsDir: string;
  compiledJsDir: string;
  hostRoot: string;
  minPrjDir: string;
  minDepsDir: string;
  flashDir: string;
  srcDir: string;
  dependenciesBuildDir: string;
  mainJsFileName: string;
  bundleFile: string;
  prjConfigYaml: string;
  bootrstPath: string;
  strictMode?: boolean;
}


export function makeEnvConfig(envPrjConfig: {[index: string]: any}, envConfigPath: string): BuildConfig {
  const envConfigBaseDir = path.dirname(envConfigPath);
  const buildDir = path.resolve(envConfigBaseDir, envPrjConfig.dst);

  return {
    buildDir,
    srcDir: path.resolve(envConfigBaseDir, envPrjConfig.src),
    prjConfigYaml: path.resolve(envConfigBaseDir, envPrjConfig.prjConfig),
    compiledTsDir: path.join(buildDir, 'compiled-ts'),
    compiledJsDir: path.join(buildDir, 'compiled-js'),
    hostRoot: 'system/host',
    minPrjDir: path.join(buildDir, 'minPrj'),
    minDepsDir: path.join(buildDir, 'minDeps'),
    flashDir: path.join(buildDir, 'flash'),
    dependenciesBuildDir: path.join(buildDir, 'deps'),
    mainJsFileName: `${envPrjConfig.main}.js`,
    bundleFile: path.join(buildDir, 'bundle.js'),
    bootrstPath: path.join(__dirname, '.bootrst'),
    strictMode: envPrjConfig.strictMode,
  };
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

// export function makeModulesTree(rootDir: string, relativeMainFile: string): string[] {
//   return dependencyTree.toList({
//     filename: path.join(rootDir, relativeMainFile),
//     directory: rootDir,
//     // exclude node_modules
//     filter: (curPath: string) => curPath.indexOf('node_modules') === -1, // optional
//   });
// }
