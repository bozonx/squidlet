import * as path from 'path';
import * as fs from 'fs';
import * as gulp from 'gulp';
import * as yargs from 'yargs';
import * as yaml from 'js-yaml';
import * as shelljs from 'shelljs';
import * as rimraf from 'rimraf';
import _defaultsDeep = require('lodash/defaultsDeep');
import _uniq = require('lodash/uniq');

import {resolveParamRequired} from './helpers/buildHelpers';
import EnvBuilder from './hostEnvBuilder/EnvBuilder';
import PreHostConfig from './hostEnvBuilder/interfaces/PreHostConfig';
import ClusterConfig from './hostEnvBuilder/interfaces/ClusterConfig';
import * as rimraf from './lowjs/tasks';


function makeHostConfig(hostId: string, clusterConfig: ClusterConfig): PreHostConfig {
  const mergedConfig: PreHostConfig = _defaultsDeep({}, clusterConfig.hosts[hostId], clusterConfig.hostDefaults);

  mergedConfig.plugins = _uniq([
    ...mergedConfig.plugins,
    ...clusterConfig.plugins,
  ]);

  return mergedConfig;
}


// hosts configs and entities of them
gulp.task('build-cluster', async () => {
  const resolvedConfigPath: string = resolveParamRequired('CONFIG', 'config');
  const absConfigPath = path.resolve(process.cwd(), resolvedConfigPath);
  const relativeBuildDir: string | undefined = process.env.BUILD_DIR || <string>yargs.argv['build-dir'];
  const buildDir: string | undefined = relativeBuildDir && path.resolve(process.cwd(), relativeBuildDir);
  const clusterConfig: ClusterConfig = yaml.load(fs.readFileSync(absConfigPath, {encoding : 'utf8'}));

  // Build each host

  for (let hostId of Object.keys(clusterConfig.hosts)) {
    const hostConfig: PreHostConfig = makeHostConfig(hostId, clusterConfig);
    const hostBuildDir: string = path.join(buildDir, hostId);

    shelljs.mkdir('-p', hostBuildDir);
    rimraf.sync(`${hostBuildDir}/**/*`);

    console.info(`===> generating configs and entities of host "${hostId}"`);

    const envBuilder: EnvBuilder = new EnvBuilder(undefined, hostBuildDir, hostConfig);

    await envBuilder.collect();
    await envBuilder.writeConfigs();
    await envBuilder.writeEntities();
  }

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
