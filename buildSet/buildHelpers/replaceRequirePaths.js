const path = require('path');
const gulp = require('gulp');
const pump = require('pump');
const replace = require('gulp-replace');
const {PATH_SEPARATOR, makeModuleName} = require('./helpers');


module.exports = function replaceRequirePaths (srcDir, moduleRoot) {
  return new Promise((resolve, reject) => {
    pump(
      [
        gulp.src(`${srcDir}/**/*.js`),
        replace(/require\(['"]([^\n]+)['"]\)/g, function (fullMatch, savedPart) {
          // skip not local modules
          if (!savedPart.match(/^\./)) return fullMatch;

          const currentFileFullPath = this.file.path;
          const baseDir = path.dirname(currentFileFullPath);
          const depFullPath = path.resolve(baseDir, savedPart);
          const moduleName = makeModuleName(baseDir, depFullPath, moduleRoot);
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
