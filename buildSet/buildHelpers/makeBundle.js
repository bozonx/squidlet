// const { fork } = require('child_process');
const path = require('path');
const _ = require('lodash');
const dependencyTree = require('dependency-tree');
const fs = require('fs');

const fsPromises = fs.promises;
const {makeModuleCached, makeNormalModuleName, makeModuleName, stripExtension} = require('./helpers');


function moduleCachedLine(moduleName, moduleContent) {
  return `${makeModuleCached(moduleName, moduleContent)};\n`;
}

function makeModulesTree (rootDir, mainFile) {
  return dependencyTree.toList({
    filename: path.join(rootDir, mainFile),
    directory: rootDir,
    // exclude node_modules
    filter: path => path.indexOf('node_modules') === -1, // optional
  });
}

function replaceRootOfModule(rootDir, currentFileFullPath, relativeModulePathInRequire, moduleRoot) {
  const baseDir = path.dirname(currentFileFullPath);
  const depFullPath = path.resolve(baseDir, relativeModulePathInRequire);
  const moduleName = makeModuleName(rootDir, depFullPath, moduleRoot);

  return moduleName;
}

function replaceRequirePaths (rootDir, currentFileFullPath, moduleContent, moduleRoot) {

  // TODO: remove it
  const prepareToReplace = moduleContent.replace(/;/g, ';\n');

  return prepareToReplace.replace(/require\(['"]([^\n]+)['"]\)/g, (fullMatch, savedPart) => {
    // skip not local modules
    if (!savedPart.match(/^\./)) return fullMatch;

    const replacedModulePath = replaceRootOfModule(rootDir, currentFileFullPath, savedPart, moduleRoot);

    return fullMatch.replace(savedPart, replacedModulePath);
  });
}

/**
 * Collect modules and make array like [ [moduleName, moduleContent] ]
 */
async function collectAppModules (rootDir, mainFile, moduleRoot) {
  const modulesFilePaths = makeModulesTree(rootDir, mainFile);

  let result = [];

  for (let fullFilePath of modulesFilePaths) {
    const moduleName = makeModuleName(rootDir, fullFilePath, moduleRoot);
    const moduleContent = await fsPromises.readFile(fullFilePath, {encoding: 'utf8'});
    const moduleComplete = replaceRequirePaths(rootDir, fullFilePath, moduleContent, moduleRoot);

    result.push([moduleName, moduleComplete]);
  }

  return result;
}

async function bundleApp (rootDir, mainFile) {
  let result = '';

  const modules = await collectAppModules(rootDir, mainFile);

  for (let module of modules) {
    result += moduleCachedLine(module[0], module[1]);
  }

  return result;
}

/**
 * Read all the files from dependencies dir and put content of them to Module.addCached()
 */
async function depsBundle(dstDir) {
  let filesInDir = [];

  try {
    filesInDir = await fsPromises.readdir(dstDir);
  }
  catch (err) {
    return '';
  }

  let result = '';

  for (let fileName of filesInDir) {
    const moduleContent = await fsPromises.readFile(path.join(dstDir, fileName), { encoding: 'utf8' }) || '';
    const normalModuleName = makeNormalModuleName(fileName);
    const realModuleName = stripExtension(normalModuleName, 'js');

    result += moduleCachedLine(realModuleName, moduleContent);
  }

  return result;
}

/**
 * Glue dependencies and project files and add require() of index module
 */
function makeMainBundleFile(depsBundleStr, appBundleStr, mainModuleName) {
  let result = 'Modules.removeAllCached();\n';

  result += depsBundleStr;
  result += appBundleStr;
  result += `require("${mainModuleName}");`;

  return result;
}


/**
 * make bundle for espruino. Files which are required will be prepended to bundle as Modules.addCached(...)
 */
async function makeBundle(compiledJsDir, dependenciesBuildDir, mainJsFileName, espReadyBundleFileName) {
  const mainJsFilePath = path.join(compiledJsDir, mainJsFileName);

  if (!fs.existsSync(mainJsFilePath)) {
    throw new Error('main app file does not exit ' + mainJsFilePath);
  }

  // TODO: make module name - use mainJsFileName
  const mainModuleName = './index';
  const appBundled = await bundleApp(compiledJsDir, mainJsFilePath);
  const depsBundled = await depsBundle(dependenciesBuildDir);
  const mainBundle = makeMainBundleFile(depsBundled, appBundled, mainModuleName);

  await fsPromises.writeFile(espReadyBundleFileName, mainBundle);
}

module.exports.makeBundle = makeBundle;
module.exports.collectAppModules = collectAppModules;


// const buildproc = fork(
//   require.resolve('espruino/bin/espruino-cli'),
//   _.compact([
//     '--board', envConfig.board,
//     envConfig.minimize && '-m',
//     mainJsFilePath, '-o',
//     espReadyBundleFileName
//   ]),
//   { cwd: compiledJsDir }
// );
//
// buildproc.on('close', async (code) => {
//   await prependDepsToBundle(dependenciesBuildDir, espReadyBundleFileName);
//   cb();
// });
