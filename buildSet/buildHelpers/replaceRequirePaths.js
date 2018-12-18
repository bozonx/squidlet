const path = require('path');
const gulp = require('gulp');
const pump = require('pump');
const replace = require('gulp-replace');
const {PATH_SEPARATOR, stripExtension} = require('./helpers');


module.exports = function replaceRequirePaths (srcDir, moduleRoot) {
  return new Promise((resolve, reject) => {
    pump(
      [
        gulp.src(`${srcDir}/**/*.js`),
        replace(/require\(['"]([^\n]+)['"]\)/g, function (fullMatch, savedPart) {
          //const moduleStartRegex = new RegExp(`^[\\.\\${path.sep}]`);

          console.log(11111, fullMatch, savedPart)

          // skip not local modules
          if (!savedPart.match(/^\./)) return;

          const currentFileFullStripPath = stripExtension(this.file.path, 'js');
          const currentFileRelPath = path.relative(srcDir, currentFileFullStripPath);
          const moduleName = `${moduleRoot}${PATH_SEPARATOR}${currentFileRelPath}`;
          const replecement = fullMatch.replace(savedPart, moduleName);

          console.log(222222222, replecement);

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
