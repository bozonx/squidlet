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
const PRJ_CONFIG_YAML = path.resolve(__dirname, 'prjConfig.yaml');


gulp.task('build', async () => {
  rimraf.sync(`${MODERN_DST_DIR}/**/*`);
  rimraf.sync(`${LEGACY_DST_DIR}/**/*`);
  await compileTs(CORE_SRC_DIR, MODERN_DST_DIR);
  await compileJs(MODERN_DST_DIR, LEGACY_DST_DIR, false);
  //await collectDependencies(PRJ_CONFIG_YAML, buildConfig.dependenciesBuildDir);
  //await minimize(buildConfig.compiledJsDir, buildConfig.minPrjDir);

  //const modulesFileNames = makeModulesTree(LEGACY_DST_DIR, 'index.js');

  //console.log(111111111, makeModulesTree)

  await modulesTree(LEGACY_DST_DIR, TREE_DST_DIR);

  rimraf.sync(`${DST_DIR}/**/*`);
  // TODO: разрешить дерево зависимостей
});
