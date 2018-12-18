const path = require('path');
const gulp = require('gulp');
const replace = require('gulp-replace-path');
const pump = require('pump');


module.exports = function replaceRequirePaths (srcDir) {
  return new Promise((resolve, reject) => {
    pump(
      [
        gulp.src(`${srcDir}/**/*.js`),
        replace(/require\((\'|\".+)\'|\"\)/g, function (match, __absolutePath__) {

          console.log(match, __absolutePath__);

          return match;
          //return path.dirname(path.relative(paths.src, __absolutePath__));
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
