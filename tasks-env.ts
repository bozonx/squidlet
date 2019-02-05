import * as path from 'path';
import * as gulp from 'gulp';
import * as yargs from 'yargs';

import {resolveParamRequired} from './helpers/buildHelpers';
import EnvBuilder from './hostEnvBuilder/EnvBuilder';


const ENTITIES_DIR = 'entities';
const ENV_DIR = 'env';


// hosts configs and entities of them
gulp.task('build-cluster', async () => {


  // TODO: remake to parse hosts set

  // const resolvedConfigPath: string = resolveParamRequired('CONFIG', 'config');
  // const absConfigPath = path.resolve(process.cwd(), resolvedConfigPath);
  // const relativeBuildDir: string | undefined = process.env.BUILD_DIR || <string>yargs.argv['build-dir'];
  // const buildDir: string | undefined = relativeBuildDir && path.resolve(process.cwd(), relativeBuildDir);
  // const entitiesBuildDir: string | undefined = buildDir && path.join(buildDir, ENTITIES_DIR);
  // const envBuildDir: string | undefined = buildDir && path.join(buildDir, ENV_DIR);
  // const envBuilder: EnvBuilder = new EnvBuilder(absConfigPath, entitiesBuildDir, envBuildDir);
  //
  // // TODO: mkdir
  // // TODO: clear dirs
  //
  // console.info(`===> generating hosts env files and configs`);
  //
  // await envBuilder.collect();
  // await envBuilder.writeConfigs(true);
});


// gulp.task('build-entities', async () => {
//   const resolvedConfigPath: string = resolveParamRequired('CONFIG', 'config');
//   const resolvedBuildDir: string | undefined = resolveParam('BUILD_DIR', 'build-dir');
//   const absMasterConfigPath: string = path.resolve(process.cwd(), resolvedConfigPath);
//   const absBuildDir: string | undefined = resolvedBuildDir && path.resolve(process.cwd(), resolvedBuildDir);
//
//   const mainEntities: MainEntities = new MainEntities(absMasterConfigPath, absBuildDir);
//
//   await mainEntities.collect();
//   await mainEntities.write();
//
// });
