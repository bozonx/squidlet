const gulp = require('gulp');
const terser = require('gulp-terser');
const pump = require('pump');


module.exports = function minimize (srcDir, dstDir) {
  return new Promise((resolve, reject) => {
    pump(
      [
        gulp.src(`${srcDir}/**/*.js`),
        terser({
          //ecma: 7,
          // keep_fnames: true,
          // keep_classnames: true,
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
