// const { fork } = require('child_process');
const path = require('path');
const _ = require('lodash');
const dependencyTree = require('dependency-tree');
const fs = require('fs');

const fsPromises = fs.promises;
const {makeModuleCached, makeNormalModuleName, makeModuleName} = require('./helpers');


function moduleCachedLine(moduleName, moduleContent) {
  return `${makeModuleCached(moduleName, moduleContent)};\n`;
}

/**
 * Collect modules and make array like [ [moduleName, moduleContent] ]
 */
async function collectAppModules (rootDir, mainFile) {
  const modulesFilePaths = dependencyTree.toList({
    filename: mainFile,
    directory: rootDir,
    // exclude node_modules
    filter: path => path.indexOf('node_modules') === -1, // optional
  });

  let result = [];

  console.log(3333333333, rootDir, mainFile, modulesFilePaths)

  for (let filePath of modulesFilePaths) {

    // TODO: use root from config

    const moduleName = makeModuleName(filePath, rootDir, '.');
    const moduleContent = await fsPromises.readFile(filePath, {encoding: 'utf8'});

    result.push([moduleName, moduleContent]);
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
    const realModuleName = normalModuleName.replace(/\.js$/, '');

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
