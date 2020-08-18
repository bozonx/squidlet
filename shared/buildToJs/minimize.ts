import * as gulp from 'gulp';
import pump from 'pump';
const terser = require('gulp-terser');


export default function minimize (srcDir: string, dstDir: string) {
  return new Promise((resolve, reject) => {
    pump(
      [
        gulp.src(`${srcDir}/**/*.js`),
        terser({
          // TODO: if true it removes EOF
          compress: false,
        }),
        gulp.dest(dstDir),
      ],
      (err) => {
        if (err) return reject(err);

        resolve();
      }
    );
  });
}
