const path = require('path');
const gulp = require('gulp');
const pump = require('pump');
const replace = require('gulp-replace');
const {PATH_SEPARATOR} = require('./helpers');


module.exports = function replaceRequirePaths (srcDir, moduleRoot) {
  return new Promise((resolve, reject) => {
    pump(
      [
        gulp.src(`${srcDir}/**/*.js`),
        replace(/require\(['"](.+)['"]\)/g, function (fullMatch, savedPart) {
          const currentFileFullPath = this.file.path;
          const currentFileRelPath = path.relative(srcDir, currentFileFullPath);
          const moduleName = `${moduleRoot}${PATH_SEPARATOR}${currentFileRelPath}`;

          return moduleName;
        }),
        gulp.dest(srcDir),
      ],
      (err) => {
        if (err) return reject(err);

        resolve();
      }
    );
  });
};
