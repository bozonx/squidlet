const path = require('path');
const fs = require('fs');
const shelljs = require('shelljs');
const dependencyTree = require('dependency-tree');

const fsPromises = fs.promises;
const PATH_SEPARATOR = '/';

function stripExtension(filePath, extension) {
  const regex = new RegExp(`\\.${extension}$`);

  return filePath.replace(regex, '');
}

function stringify (moduleContent) {
  let preparedContent = moduleContent || '';

  preparedContent = preparedContent.replace(/\\/g, '\\\\');
  preparedContent = preparedContent.replace(/\"/g, '\\"');
  preparedContent = preparedContent.replace(/\n/g, '\\n');

  return preparedContent;
}


// async function eachFileRecursively(rootDir, cb) {
//   let currentDirs;
//
//   try {
//     currentDirs = fsPromises.readdir(rootDir);
//   }
//   catch (err) {
//     throw new Error(`Can't read dir "${rootDir}". ${String(err)}`);
//   }
//
//   // dir doesn't exists
//   if (!currentDirs) return;
//
//   // TODO: проверить
//   console.log(1111111, currentDirs);
//
//   // remove "." and ".."
//   const preparedDirList = currentDirs.slice(2);
//
//   for (let fileOrDir of preparedDirList) {
//     const fileOrDirPath = `${rootDir}/${fileOrDir}`;
//     const statResult = fsPromises.stat(fileOrDirPath);
//
//     // TODO: проверить
//     console.log(1111111, statResult);
//
//     if (statResult.dir) {
//       // it's dir - go recursively
//       return eachFileRecursively(fileOrDirPath, cb);
//     }
//
//     // it's file
//     cb(fileOrDirPath);
//   }
//
// }

module.exports = {
  PATH_SEPARATOR,
  stripExtension,
  stringify,
  //eachFileRecursively,

  projectConfig(envPrjConfig) {
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
  },

  clearDir(dirName) {
    shelljs.rm('-rf', path.join(dirName, '*'));
  },

  makeSafeModuleName: (fileName) => {
    return fileName.replace(/\//g, '|')
  },

  makeNormalModuleName: (fileName) => {
    return fileName.replace(/\|/g, '/')
  },

  makeModuleCached: (moduleName, moduleContent) => {
    return `Modules.addCached("${moduleName}", "${stringify(moduleContent)}")`;
  },

  // TODO: дублируется - наверное лучше взять из starterMc/helper.ts
  makeModuleName(baseDir, moduleFullPath, moduleRoot) {
    const strippedModuleName = stripExtension(moduleFullPath, 'js');
    const moduleRelPath = path.relative(baseDir, strippedModuleName);
    const moduleName = `${moduleRoot}${PATH_SEPARATOR}${moduleRelPath}`;

    return moduleName;
  },

  makeModulesTree(rootDir, relativeMainFile) {
    return dependencyTree.toList({
      filename: path.join(rootDir, relativeMainFile),
      directory: rootDir,
      // exclude node_modules
      filter: path => path.indexOf('node_modules') === -1, // optional
    });
  },

};
