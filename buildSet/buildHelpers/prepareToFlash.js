const path = require('path');
const fs = require('fs');
const hashSum = require('hash-sum');

const {makeModulesTree, stripExtension} = require('./helpers');


const fsPromises = fs.promises;


module.exports = function prepareToFlash (srcDir, dstDir, relativeIndexFile, moduleRoot) {
  const modulesFileNames = makeModulesTree(srcDir, relativeIndexFile);
  const modulesHashNames = {};

  console.log(22222, srcDir, dstDir, relativeIndexFile, moduleRoot);

  for (let fullFileName of modulesFileNames) {
    const relativeFilePath = path.relative(srcDir, fullFileName);
    const rootFileName = path.join(moduleRoot, relativeFilePath);
    const moduleName = stripExtension(rootFileName, 'js');
    const moduleNameHash = hashSum(moduleName);

    console.log(22222, fullFileName, relativeFilePath, rootFileName, moduleName, moduleNameHash)
  }

};
