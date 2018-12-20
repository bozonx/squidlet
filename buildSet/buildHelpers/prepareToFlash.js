const path = require('path');
const fs = require('fs');
const hashSum = require('hash-sum');

const {makeModulesTree, stripExtension} = require('./helpers');


const fsPromises = fs.promises;

// TODO: собрать зависимости


function makeModulesNames (modulesFileNames, srcDir, moduleRoot) {
  const result = {};

  for (let fullFileName of modulesFileNames) {
    const relativeFilePath = path.relative(srcDir, fullFileName);
    const rootFileName = path.join(moduleRoot, relativeFilePath);
    const moduleName = stripExtension(rootFileName, 'js');
    const moduleNameHash = hashSum(moduleName);

    result[moduleNameHash] = fullFileName;
  }

  return result;
}

async function copyToFlashDir (modulesHashNames, dstDir) {
  for (let moduleNameHash of Object.keys(modulesHashNames)) {
    const dstFileName = path.join(dstDir, moduleNameHash);

    await fsPromises.copyFile(modulesHashNames[moduleNameHash], dstFileName);
  }
}


module.exports = async function prepareToFlash (srcDir, dstDir, relativeIndexFile, moduleRoot) {
  const modulesFileNames = makeModulesTree(srcDir, relativeIndexFile);
  const modulesHashNames = makeModulesNames(modulesFileNames, srcDir, moduleRoot);

  try {
    await fsPromises.mkdir(dstDir);
  }
  catch (e) {
    // do nothing
  }

  await copyToFlashDir(modulesHashNames, dstDir);
};
