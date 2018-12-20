const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const hashSum = require('hash-sum');

const {makeModulesTree, stripExtension} = require('./helpers');


const fsPromises = fs.promises;
const FULL_FILE_NAME_POS = 0;
const DST_FILE_NAME_POS = 1;


function makeModulesNames (modulesFileNames, srcDir, dstDir, moduleRoot) {

  // TODO: поидее можно просто список сделать

  const result = {};

  for (let fullFileName of modulesFileNames) {
    const relativeFilePath = path.relative(srcDir, fullFileName);
    const rootFileName = path.join(moduleRoot, relativeFilePath);
    const moduleName = stripExtension(rootFileName, 'js');
    const moduleNameHash = hashSum(moduleName);
    const dstFileName = path.join(dstDir, moduleNameHash);

    result[moduleNameHash] = [
      fullFileName,
      dstFileName,
    ];
  }

  return result;
}

async function copyToFlashDir (modules) {
  for (let moduleNameHash of Object.keys(modules)) {
    await fsPromises.copyFile(
      modules[moduleNameHash][FULL_FILE_NAME_POS],
      modules[moduleNameHash][DST_FILE_NAME_POS]
    );
  }
}

function getHashOrRelativeModule(modules, srcDir, srcFileFullPath, requiredModuleRelPath) {
  const baseDir = path.dirname(srcFileFullPath);
  const depFullPath = path.resolve(baseDir, `${requiredModuleRelPath}.js`);
  let depHashName;
  const foundItem = _.find(modules, (item, index) => {
    if (item[FULL_FILE_NAME_POS] === depFullPath) {
      depHashName = index;

      return true;
    }
  });

  if (!depHashName) {
    throw new Error(`Can't find local module "${requiredModuleRelPath}" in "${foundItem[FULL_FILE_NAME_POS]}"`);
  }

  return depHashName;
}

function getHashOfDependency(modules) {

}

function replaceRequirePaths (modules, moduleContent, srcDir, srcFileFullPath) {

  // TODO: remove it
  const prepareToReplace = moduleContent.replace(/;/g, ';\n');

  return prepareToReplace.replace(/require\(['"]([^\n]+)['"]\)/g, (fullMatch, savedPart) => {
    let depHashName;
    
    // skip not local modules
    if (savedPart.match(/^\./)) {
      // local module
      depHashName = getHashOrRelativeModule(modules, srcDir, srcFileFullPath, savedPart);
    }
    else {
      // trird party dependency
      depHashName = getHashOfDependency();
    }

    return fullMatch.replace(savedPart, depHashName);
  });
}

async function renameLocalModulesRequires(modules, srcDir) {
  for (let moduleNameHash of Object.keys(modules)) {
    const moduleContent = await fsPromises.readFile(
      modules[moduleNameHash][DST_FILE_NAME_POS],
      {encoding: 'utf8'}
    );
    const replacedContent = replaceRequirePaths(
      modules,
      moduleContent,
      srcDir,
      modules[moduleNameHash][FULL_FILE_NAME_POS]
    );

    await fsPromises.writeFile(
      modules[moduleNameHash][DST_FILE_NAME_POS],
      replacedContent,
      {encoding: 'utf8'}
    );
  }
}


module.exports = async function prepareToFlash (srcDir, dstDir, relativeIndexFile, moduleRoot) {
  const modulesFileNames = makeModulesTree(srcDir, relativeIndexFile);
  const modules = makeModulesNames(modulesFileNames, srcDir, dstDir, moduleRoot);

  try {
    await fsPromises.mkdir(dstDir);
  }
  catch (e) {
    // do nothing
  }

  await copyToFlashDir(modules);
  await renameLocalModulesRequires(modules, srcDir);
};
