import * as path from 'path';
import * as gulp from 'gulp';
import * as rimraf from 'rimraf';

import compileTs from '../squidlet-starter/buildJs/compileTs';
import compileJs from '../squidlet-starter/buildJs/compileJs';
//import collectDependencies from '../squidlet-starter/buildJs/collectDependencies';
import minimize from '../squidlet-starter/buildJs/minimize';
import modulesTree from '../squidlet-starter/buildJs/modulesTree';


const BUILD_DIR = path.resolve(__dirname, 'build');
const DIST_DIR = path.resolve(__dirname, 'dist');
const CORE_SRC_DIR = path.resolve(__dirname, 'core');
const DST_DIR = path.join(DIST_DIR, 'src');
const MODERN_DST_DIR = path.join(BUILD_DIR, 'modern');
const LEGACY_DST_DIR = path.join(BUILD_DIR, 'legacy');
const TREE_DST_DIR = path.join(BUILD_DIR, 'tree');
const MIN_DST_DIR = path.join(BUILD_DIR, 'min');
//const PRJ_CONFIG_YAML = path.resolve(__dirname, 'prjConfig.yaml');


gulp.task('build', async () => {
  // ts to modern js
  rimraf.sync(`${MODERN_DST_DIR}/**/*`);
  await compileTs(CORE_SRC_DIR, MODERN_DST_DIR);
  // modern js to ES5
  rimraf.sync(`${LEGACY_DST_DIR}/**/*`);
  await compileJs(MODERN_DST_DIR, LEGACY_DST_DIR, false);
  // Get only used files
  rimraf.sync(`${TREE_DST_DIR}/**/*`);
  await modulesTree(LEGACY_DST_DIR, TREE_DST_DIR);
  // minimize
  rimraf.sync(`${MIN_DST_DIR}/**/*`);
  await minimize(TREE_DST_DIR, MIN_DST_DIR);

  //rimraf.sync(`${DST_DIR}/**/*`);
  // TODO: разрешить дерево зависимостей
});
