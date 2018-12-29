import * as fs from 'fs';
import * as path from 'path';
import * as gulp from 'gulp';
import * as yaml from 'js-yaml';
import * as yargs from 'yargs';

import {makeEnvConfig, clearDir} from './helpers';
import compileJs from './buildJs/compileJs';
import compileTs from './buildJs/compileTs';
import collectDependencies from './buildJs/collectDependencies';
import minimize from './buildJs/minimize';
import {resolveParam} from './helpers';
import MainHostsEnv from './buildHostEnv/MainHostsEnv';


// TODO: получить из агрументов
const envConfigPath = path.resolve(__dirname, './env-config.yaml');
const envConfigParsedYaml = yaml.load(fs.readFileSync(envConfigPath, {encoding : 'utf8'}));
const buildConfig = makeEnvConfig(envConfigParsedYaml, envConfigPath);

// TODO: поидее не нужно
const DEFAULT_ENV_DIR = './build/env';


// hosts configs and entities
gulp.task('build-env', async () => {

  // TODO: clear

  //clearDir(buildConfig.buildDir);

  const resolvedConfigPath: string = resolveParam('CONFIG', 'config');
  // TODO: get from args
  const resolvedBuildDir: string | undefined = process.env.BUILD_DIR
    || (yargs.argv['build-dir'] as string)
    || DEFAULT_ENV_DIR;

  const mainHostsEnv: MainHostsEnv = new MainHostsEnv(absMasterConfigPath, absBuildDir);

  console.info(`===> generate hosts env files and configs`);

  await mainHostsEnv.collect();
  await mainHostsEnv.write(true);

});

// host src
gulp.task('build-host', async () => {
  clearDir(buildConfig.buildDir);
  await compileTs(buildConfig.srcDir, buildConfig.compiledTsDir);
  await compileJs(buildConfig.compiledTsDir, buildConfig.compiledJsDir, buildConfig.strictMode);
  //await collectDependencies(buildConfig.prjConfigYaml, buildConfig.dependenciesBuildDir);
  // min prj
  await minimize(buildConfig.compiledJsDir, buildConfig.minPrjDir);
  // min deps
  //await minimize(buildConfig.dependenciesBuildDir, buildConfig.minDepsDir);
});
