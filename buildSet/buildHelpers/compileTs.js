const gulp = require('gulp');
const ts = require("gulp-typescript");


module.exports = function compileTs(srcDir, destDir) {
  return new Promise((resolve, reject) => {

    const tsProject = ts.createProject("tsconfig-builder.json");

    //return tsProject.src()
    return gulp.src(`${srcDir}/**/*.ts`)
      .pipe(tsProject())
      .js.pipe(gulp.dest(destDir))
      .on('end', resolve)
      .on('error', reject);
  });

};
