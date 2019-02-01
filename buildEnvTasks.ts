import * as fs from 'fs';
import * as path from 'path';
import * as gulp from 'gulp';
import * as yaml from 'js-yaml';
import * as yargs from 'yargs';

import {resolveParamRequired} from './helpers/buildHelpers';
import {resolveParam} from './helpers/buildHelpers';
import MainHostsEnv from './hostEnvBuilder/MainHostsEnv';
import MainEntities from './hostEnvBuilder/MainEntities';


// TODO: получить из агрументов
const envConfigPath = path.resolve(__dirname, './env-config.yaml');
const envConfigParsedYaml = yaml.load(fs.readFileSync(envConfigPath, {encoding : 'utf8'}));

// TODO: поидее не нужно
const DEFAULT_ENV_DIR = './build/env';


gulp.task('build-entities', async () => {

  // TODO: !!!!!

  const resolvedConfigPath: string = resolveParamRequired('CONFIG', 'config');
  const resolvedBuildDir: string | undefined = resolveParam('BUILD_DIR', 'build-dir');
  const absMasterConfigPath: string = path.resolve(process.cwd(), resolvedConfigPath);
  const absBuildDir: string | undefined = resolvedBuildDir && path.resolve(process.cwd(), resolvedBuildDir);

  const mainEntities: MainEntities = new MainEntities(absMasterConfigPath, absBuildDir);

  await mainEntities.collect();
  await mainEntities.write();

});

// hosts configs and entities of them
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
