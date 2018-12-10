import * as gulp from 'gulp';
import * as path from 'path';
const ts = require('gulp-typescript');

const buildDirName = 'build/starter';
const buildDir = path.resolve(__dirname, buildDirName);


export default async function () {
  const tsProject = ts.createProject('tsconfig-builder.json', {
    outDir: path.resolve(buildDir, 'ts'),
    //rootDir: '',
  });

  return gulp.src([
    path.resolve(__dirname, './starterMc/index.ts'),
  ])
    .pipe(tsProject())
    .js.pipe(gulp.dest(buildDir));
}
