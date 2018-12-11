import * as gulp from 'gulp';
import * as path from 'path';
const ts = require('gulp-typescript');

const buildDirName = 'build/starter';
const buildDir = path.resolve(__dirname, buildDirName);


export default async function () {
  const tsProject = ts.createProject('tsconfig-builder.json', {
    //rootDir: [''],
    //outDir: path.resolve(buildDir, 'ts'),
    outFile: 'index.js',
  });

  return gulp.src([
    //path.resolve(__dirname, './starterMc/promise.js'),
    path.resolve(__dirname, './starterMc/systemLoader.ts'),
    //path.resolve(__dirname, './starterMc/polyfill.ts'),
    path.resolve(__dirname, './starterMc/index.ts'),
    //path.resolve(__dirname, './starterMc/init.js'),
  ])
    .pipe(tsProject())
    .js.pipe(gulp.dest(buildDir));
}
