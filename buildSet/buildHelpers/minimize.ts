import * as gulp from 'gulp';
import * as pump from 'pump';
const terser = require('gulp-terser');


export default function minimize (srcDir: string, dstDir: string) {
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
