const path = require('path');
const gulp = require('gulp');
const babel = require('gulp-babel');
const dependencyTree = require('dependency-tree');


module.exports = {
  bundleApp: () => {
    const list = dependencyTree.toList({
      filename: mainJsFilePath,
      directory: compiledDir,
      filter: path => path.indexOf('node_modules') === -1, // optional
    });

    console.log(11111111, list)
  },

};
