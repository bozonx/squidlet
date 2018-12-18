const path = require('path');
const shelljs = require('shelljs');


module.exports = {
  projectConfig(envPrjConfig) {
    const buildDir = path.resolve(process.cwd(), envPrjConfig.dst);
    const compiledTsDir = path.join(buildDir, 'compiled-ts');
    const compiledJsDir = path.join(buildDir, 'compiled-js');

    return {
      buildDir,
      compiledTsDir,
      compiledJsDir,
      minPrjDir: path.join(buildDir, 'minPrj'),
      minDepsDir: path.join(buildDir, 'minDeps'),
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
    let preparedContent = moduleContent || '';

    preparedContent = preparedContent.replace(/\\/g, '\\\\');
    preparedContent = preparedContent.replace(/\"/g, '\\"');
    preparedContent = preparedContent.replace(/\n/g, '\\n');

    return `Modules.addCached("${moduleName}", "${preparedContent}")`;
  },

  // TODO: дублируется - наверное лучше взять из starterMc/helper.ts
  makeModuleName: (filePath, rootToRemove, newRoot) => {
    let result = filePath;
    const removedRoot = filePath.split(rootToRemove);

    if (removedRoot.length > 1) {
      // success
      result = removedRoot[1];
    }

    // remove extension
    result = result.replace(/\.js$/, '');

    return `${newRoot}${result}`;
  }

};
