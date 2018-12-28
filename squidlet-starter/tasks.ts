import * as fs from 'fs';
import * as path from 'path';
import * as gulp from 'gulp';
import * as yaml from 'js-yaml';
import * as yargs from 'yargs';

import {makeEnvConfig, clearDir} from './helpers';
import compileJs from './build-js/compileJs';
import compileTs from './build-js/compileTs';
import collectDependencies from './build-js/collectDependencies';
import minimize from '../squidlet-starter/build-js/minimize';
import prepareToFlash from './src/prepareToFlash';
import upload from './src/upload';
import {initConfigWorks, resolveParam} from '../host/src/helpers';


// TODO: получить из агрументов
const envConfigPath = path.resolve(__dirname, './env-config.yaml');
const envConfigParsedYaml = yaml.load(fs.readFileSync(envConfigPath, {encoding : 'utf8'}));
const buildConfig = makeEnvConfig(envConfigParsedYaml, envConfigPath);


// configs
gulp.task('build-configs', async () => {
  const resolvedConfigPath: string = resolveParam('CONFIG', 'config');
  // TODO: get from args
  const resolvedBuildDir: string | undefined = process.env.BUILD_DIR || './build/configs';

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
