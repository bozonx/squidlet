import * as path from 'path';
import * as gulp from 'gulp';
import * as ts from 'gulp-typescript';


export default function compileTs(srcDir: string, destDir: string) {
  return new Promise((resolve, reject) => {

    const tsProject = ts.createProject(path.resolve(__dirname, 'tsconfig-builder.json'), {
      // rootDir: '',
    });

    return gulp
      .src(path.resolve(srcDir, `**/*.ts`))
      .pipe(tsProject())
      .js.pipe(gulp.dest(destDir))
      .on('error', reject)
      .on('end', resolve);
  });

}
