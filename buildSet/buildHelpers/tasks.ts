import * as fs from 'fs';
import * as gulp from 'gulp';
import * as yaml from 'js-yaml';

import {projectConfig, clearDir} from './helpers';
import compileJs from './compileJs';
import compileTs from './compileTs';
import collectDependencies from './collectDependencies';
import minimize from './minimize';
import prepareToFlash from './prepareToFlash';
import {uploadToFlash} from './upload';


const envConfig = yaml.load(fs.readFileSync('env-config.yaml'));
const projectCfg = projectConfig(envConfig.project);


// host
gulp.task('build-host', async () => {
  clearDir(projectCfg.buildDir);
  await compileTs(projectCfg.srcDir, projectCfg.compiledTsDir);
  await compileJs(projectCfg.compiledTsDir, projectCfg.compiledJsDir, projectCfg.strictMode);
  await collectDependencies(projectCfg.prjConfigYaml, projectCfg.dependenciesBuildDir);
  // min prj
  await minimize(projectCfg.compiledJsDir, projectCfg.minPrjDir);
  // min deps
  await minimize(projectCfg.dependenciesBuildDir, projectCfg.minDepsDir);
  await prepareToFlash(
    projectCfg.minPrjDir,
    projectCfg.minDepsDir,
    projectCfg.flashDir,
    projectCfg.mainJsFileName,
    projectCfg.moduleRoot
  );
});

// upload all the files
gulp.task('upload', async () => {
  await uploadToFlash(
    envConfig.board,
    envConfig.port,
    envConfig.portSpeed,
    projectCfg.flashDir
  );
});

// // build and upload project
// gulp.task('prj', gulp.series('build', 'upload'), async () => {
// });
