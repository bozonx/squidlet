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
        replace(/require\(['"]([^\n]+)['"]\)/, function (fullMatch, savedPart) {
          console.log(11111, fullMatch, '-----------', savedPart)

          // skip not local modules
          if (!savedPart.match(/^\./)) return fullMatch;

          const currentFileFullStripPath = this.file.path;
          const baseDir = path.dirname(currentFileFullStripPath);
          const depFullPath = path.resolve(baseDir, savedPart);
          const currentFileRelPath = path.relative(srcDir, depFullPath);
          const moduleName = `${moduleRoot}${PATH_SEPARATOR}${currentFileRelPath}`;
          const replacement = fullMatch.replace(savedPart, moduleName);

          console.log(222222222, currentFileRelPath, moduleName, replacement);

          return fullMatch;
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
