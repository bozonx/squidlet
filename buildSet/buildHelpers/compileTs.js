const path = require('path');
const gulp = require('gulp');
const ts = require("gulp-typescript");


module.exports = function compileTs(srcDir, destDir) {
  return new Promise((resolve, reject) => {

    const tsProject = ts.createProject(path.resolve(__dirname, "tsconfig-builder.json"), {
      // rootDir: [path.resolve(__dirname, './starterMc')],
      // outDir: compiledTsDir,
      //outDir: 'cccc',
      //outFile: 'index.js',
    });

    //return tsProject.src()
    return gulp
      .src(path.resolve(srcDir, `**/*.ts`))
      .pipe(tsProject())
      .js.pipe(gulp.dest(destDir))
      .on('error', reject)
      .on('end', resolve);
  });

};
