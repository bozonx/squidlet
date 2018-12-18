const gulp = require('gulp');
const terser = require('gulp-terser');
const pump = require('pump');


module.exports = function minimize (srcDir, dstDir) {
  return new Promise((resolve, reject) => {
    pump(
      [
        gulp.src(`${srcDir}/**/*`),
        terser({
          // TODO: !!! setup - it removes EOF
          compress: false,
          //mangle: false,
        }),
        gulp.dest(dstDir),
      ],
      (err) => {
        if (err) return reject(err);

        resolve();
      }
    );
  });
};
