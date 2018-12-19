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
        replace(/require\(['"]([^\n]+)['"]\)/g, function (fullMatch, savedPart) {
          // skip not local modules
          if (!savedPart.match(/^\./)) return fullMatch;

          const currentFileFullStripPath = this.file.path;
          const baseDir = path.dirname(currentFileFullStripPath);
          const depFullPath = path.resolve(baseDir, savedPart);
          const currentFileRelPath = path.relative(srcDir, depFullPath);
          const moduleName = `${moduleRoot}${PATH_SEPARATOR}${currentFileRelPath}`;
          const replacement = fullMatch.replace(savedPart, moduleName);

          return replacement;
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
