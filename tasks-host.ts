import * as path from 'path';
import * as gulp from 'gulp';
import * as rimraf from 'rimraf';

import compileTs from './helpers/buildJs/compileTs';
import compileJs from './helpers/buildJs/compileJs';
import minimize from './helpers/buildJs/minimize';
import modulesTree from './helpers/buildJs/modulesTree';


const BUILD_DIR = path.resolve(__dirname, 'build');
const DIST_DIR = path.resolve(__dirname, 'dist');
const CORE_SRC_DIR = path.resolve(__dirname, 'core');
const MODERN_DST_DIR = path.join(BUILD_DIR, 'modern');
const LEGACY_DST_DIR = path.join(BUILD_DIR, 'legacy');
const DEV_DST_DIR = path.join(DIST_DIR, 'dev');
const MIN_DST_DIR = path.join(DIST_DIR, 'min');


gulp.task('build', async () => {
  // ts to modern js
  rimraf.sync(`${MODERN_DST_DIR}/**/*`);
  await compileTs(CORE_SRC_DIR, MODERN_DST_DIR);
  // modern js to ES5
  rimraf.sync(`${LEGACY_DST_DIR}/**/*`);
  await compileJs(MODERN_DST_DIR, LEGACY_DST_DIR, false);
  // Get only used files
  rimraf.sync(`${DEV_DST_DIR}/**/*`);
  await modulesTree(LEGACY_DST_DIR, DEV_DST_DIR);
  // minimize
  rimraf.sync(`${MIN_DST_DIR}/**/*`);
  await minimize(DEV_DST_DIR, MIN_DST_DIR);
});
