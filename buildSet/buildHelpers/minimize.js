const gulp = require('gulp');
const uglify = require('gulp-uglify');
const pump = require('pump');


export default function minimize (srcDir, dstDir) {
  return new Promise((resolve, reject) => {
    pump([
        gulp.src(`${srcDir}/**/*.js`),
        uglify({
          // mangle: {
          //   // mangle options
          //
          //   properties: {
          //     // mangle property options
          //   }
          // },
          //toplevel: true,
        }),
        gulp.dest(dstDir)
      ],
      (err) => {
        if (err) return reject(err);

        resolve();
      }
    );
  });
}
