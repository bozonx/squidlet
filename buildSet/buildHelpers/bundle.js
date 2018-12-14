const dependencyTree = require('dependency-tree');
const fs = require('fs');
const fsPromises = fs.promises;

const {makeModuleName, makeModuleCached} = require('./helpers');


module.exports = {
  bundleApp: async (rootDir, mainFile) => {
    const modulesFilePaths = dependencyTree.toList({
      filename: mainFile,
      directory: rootDir,
      // exclude node_modules
      filter: path => path.indexOf('node_modules') === -1, // optional
    });

    // TODO: составить Mosules и вернуть


    let result = '';

    for (let filePath of modulesFilePaths) {
      const moduleName = makeModuleName(filePath, rootDir, 'system/host');
      const moduleContent = await fsPromises.readFile(filePath, {encoding: 'utf8'});

      result += makeModuleCached(moduleName, moduleContent);
    }


    return result;
  },

};
