const dependencyTree = require('dependency-tree');


module.exports = {
  bundleApp: (rootDir, mainFile) => {
    const list = dependencyTree.toList({
      filename: mainFile,
      directory: rootDir,
      // exclude node_modules
      filter: path => path.indexOf('node_modules') === -1, // optional
    });

    // TODO: составить Mosules и вернуть

    console.log(11111111, list)
  },

};
