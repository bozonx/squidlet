const path = require('path');
const shelljs = require('shelljs');


module.exports = {
  projectConfig(envPrjConfig) {
    const srcDir = path.resolve(__dirname, envPrjConfig.src);
    const buildDir = path.resolve(__dirname, envPrjConfig.dst);
    const compiledTsDir = path.join(buildDir, 'compiled-ts');
    const compiledJsDir = path.join(buildDir, 'compiled-js');
    const dependenciesBuildDir = path.join(buildDir, 'deps');
    const mainJsFile = path.resolve(compiledJsDir, `${envPrjConfig.main}.js`);
    const bundleFile = path.join(buildDir, 'bundle.js');
    const prjConfigYaml = envPrjConfig.prjConfig;

    return {
      srcDir,
      buildDir,
      compiledTsDir,
      compiledJsDir,
      dependenciesBuildDir,
      mainJsFile,
      bundleFile,
      prjConfigYaml,
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

    return `Modules.addCached("${moduleName}", "${preparedContent}");\n`;
  },

  // TODO: дублируется - наверное лучше взять из starterMc/helper.ts
  makeModuleName: (filePath, rootToRemove, newRoot) => {
    let result = filePath;
    const removedRoot = filePath.split(rootToRemove);

    if (removedRoot.length > 0) {
      // success
      result = removedRoot[1];
    }

    // remove extension
    result = result.replace(/\.js$/, '');

    return `${newRoot}${result}`;
  }

};
