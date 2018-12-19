const path = require('path');
const shelljs = require('shelljs');


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


module.exports = {
  PATH_SEPARATOR,
  stripExtension,
  stringify,

  projectConfig(envPrjConfig) {
    const buildDir = path.resolve(process.cwd(), envPrjConfig.dst);

    return {
      buildDir,
      compiledTsDir: path.join(buildDir, 'compiled-ts'),
      compiledJsDir: path.join(buildDir, 'compiled-js'),
      moduleRoot: envPrjConfig.moduleRoot,
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
    return `Modules.addCached("${moduleName}", "${stringify(moduleContent)}")`;
  },

  // TODO: дублируется - наверное лучше взять из starterMc/helper.ts
  makeModuleName(baseDir, moduleFullPath, moduleRoot) {
    const strippedModuleName = stripExtension(moduleFullPath, 'js');
    const moduleRelPath = path.relative(baseDir, strippedModuleName);
    const moduleName = `${moduleRoot}${PATH_SEPARATOR}${moduleRelPath}`;

    return moduleName;
  }

};
