import * as path from 'path';
import * as gulp from 'gulp';

import compileTs from '../squidlet-starter/buildJs/compileTs';
import compileJs from '../squidlet-starter/buildJs/compileJs';


const BUILD_DIR = path.resolve(__dirname, 'build');
const DIST_DIR = path.resolve(__dirname, 'dist');
const SRC_DIR = path.resolve(__dirname, 'src');
const DST_DIR = path.join(DIST_DIR, 'src');


gulp.task('build', async () => {
  await compileTs(SRC_DIR, BUILD_DIR);
  await compileJs(BUILD_DIR, DST_DIR, false);
});
