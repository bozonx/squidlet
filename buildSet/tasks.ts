import * as fs from 'fs';
import * as path from 'path';
import * as gulp from 'gulp';
import * as yaml from 'js-yaml';
import * as yargs from 'yargs';

import {makeEnvConfig, clearDir} from './buildHelpers/helpers';
import compileJs from './buildHelpers/compileJs';
import compileTs from './buildHelpers/compileTs';
import collectDependencies from './buildHelpers/collectDependencies';
import minimize from './buildHelpers/minimize';
import prepareToFlash from './buildHelpers/prepareToFlash';
import upload from './buildHelpers/upload';
import {initConfigWorks, resolveParam} from './helpers';


// TODO: получить из агрументов
const envConfigPath = path.resolve(__dirname, './env-config.yaml');
const envConfigParsedYaml = yaml.load(fs.readFileSync(envConfigPath, {encoding : 'utf8'}));
const buildConfig = makeEnvConfig(envConfigParsedYaml, envConfigPath);


// configs
gulp.task('build-configs', async () => {
  const resolvedConfigPath: string = resolveParam('CONFIG');
  const resolvedBuildDir: string | undefined = process.env.BUILD_DIR;

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
