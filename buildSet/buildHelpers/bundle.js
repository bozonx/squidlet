const dependencyTree = require('dependency-tree');

const {makeModuleName} = require('./helpers');


module.exports = {
  bundleApp: (rootDir, mainFile) => {
    const modulesFilePaths = dependencyTree.toList({
      filename: mainFile,
      directory: rootDir,
      // exclude node_modules
      filter: path => path.indexOf('node_modules') === -1, // optional
    });

    // TODO: составить Mosules и вернуть


    let result = '';
    const resolvedModulesNames = [];

    for (let filePath of modulesFilePaths) {
      resolvedModulesNames.push(makeModuleName(filePath, rootDir, 'system/host'));
    }

    console.log(11111111, modulesFilePaths, resolvedModulesNames);
  },

};
