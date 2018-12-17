// const { fork } = require('child_process');

const dependencyTree = require('dependency-tree');
const fs = require('fs');
const fsPromises = fs.promises;

// TODO: review
const {depsBundle} = require('./collectDependencies');

const {makeModuleName, makeModuleCached} = require('./helpers');


async function bundleApp (rootDir, mainFile) {
  const modulesFilePaths = dependencyTree.toList({
    filename: mainFile,
    directory: rootDir,
    // exclude node_modules
    filter: path => path.indexOf('node_modules') === -1, // optional
  });

  let result = '';

  for (let filePath of modulesFilePaths) {

    // TODO: use root from config

    const moduleName = makeModuleName(filePath, rootDir, '.');
    const moduleContent = await fsPromises.readFile(filePath, {encoding: 'utf8'});

    result += makeModuleCached(moduleName, moduleContent);
  }


  return result;
}

function makeMainBundleFile(depsBundle, appBundle) {
  let result = 'Modules.removeAllCached();\n';

  result += depsBundle;
  result += appBundle;

  // TODO: получить имя модуля

  result += `require("./index");`;

  return result;
}


/**
 * make bundle for espruino. Files which are required will be prepended to bundle as Modules.addCached(...)
 */
module.exports = async function makeBundle(compiledJsDir, dependenciesBuildDir, mainJsFilePath, espReadyBundleFileName) {
  if (!fs.existsSync(mainJsFilePath)) {
    throw new Error('main app file does not exit ' + mainJsFilePath);
  }

  const appBundled = await bundleApp(compiledJsDir, mainJsFilePath);
  const depsBundled = await depsBundle(dependenciesBuildDir);
  const mainBundle = makeMainBundleFile(depsBundled, appBundled);

  await fsPromises.writeFile(espReadyBundleFileName, mainBundle);

};


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
