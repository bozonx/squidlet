import * as fs from 'fs';
import * as path from 'path';
import * as gulp from 'gulp';
import * as yaml from 'js-yaml';
import * as yargs from 'yargs';

import {makeEnvConfig, clearDir} from './helpers';
import compileJs from './compileJs';
import compileTs from './compileTs';
import collectDependencies from './collectDependencies';
import minimize from './minimize';
import prepareToFlash from './prepareToFlash';
import upload from './upload';
import {initConfigWorks, resolveParam} from '../helpers';



// TODO: получить из агрументов
const envConfigPath = path.resolve(__dirname, '../env-config.yaml');
const envConfigParsedYaml = yaml.load(fs.readFileSync(envConfigPath, {encoding : 'utf8'}));
const buildConfig = makeEnvConfig(envConfigParsedYaml, envConfigPath);


// configs
gulp.task('build-configs', async () => {

  // TODO: можно не брать из yargs, в build-configs.js уже подставляется в env

  const resolvedConfigPath: string = resolveParam('CONFIG', 'config');
  const resolvedBuildDir: string | undefined = process.env.BUILD_DIR || yargs.argv['build-dir'];

  await initConfigWorks(resolvedConfigPath, resolvedBuildDir);
});

// host
gulp.task('build-host', async () => {
  clearDir(buildConfig.buildDir);
  await compileTs(buildConfig.srcDir, buildConfig.compiledTsDir);
  await compileJs(buildConfig.compiledTsDir, buildConfig.compiledJsDir, buildConfig.strictMode);
  await collectDependencies(buildConfig.prjConfigYaml, buildConfig.dependenciesBuildDir);
  // min prj
  await minimize(buildConfig.compiledJsDir, buildConfig.minPrjDir);
  // min deps
  await minimize(buildConfig.dependenciesBuildDir, buildConfig.minDepsDir);
  await prepareToFlash(
    buildConfig.minPrjDir,
    buildConfig.minDepsDir,
    buildConfig.flashDir,
    buildConfig.mainJsFileName,
    buildConfig.hostRoot
  );
});

// upload all the files
gulp.task('upload', async () => {
  await upload(
    envConfigParsedYaml.port,
    envConfigParsedYaml.portSpeed,
    buildConfig.flashDir,
    buildConfig.bootrstPath
  );
});

// // build and upload project
// gulp.task('prj', gulp.series('build', 'upload'), async () => {
// });
