import * as fs from 'fs';
import * as gulp from 'gulp';
import * as yaml from 'js-yaml';

import {projectConfig, clearDir} from './buildHelpers/helpers';
import compileJs from './buildHelpers/compileJs';
import compileTs from './buildHelpers/compileTs';
import collectDependencies from './buildHelpers/collectDependencies';
import minimize from './buildHelpers/minimize';
import prepareToFlash from './buildHelpers/prepareToFlash';
import {uploadToFlash} from './buildHelpers/upload';


const envConfig = yaml.load(fs.readFileSync('env-config.yaml'));
const projectCfg = projectConfig(envConfig.project);


// // host
// gulp.task('build-host', async () => {
//   clearDir(projectCfg.buildDir);
//   await compileTs(projectCfg.srcDir, projectCfg.compiledTsDir);
//   await compileJs(projectCfg.compiledTsDir, projectCfg.compiledJsDir, projectCfg.strictMode);
//   await collectDependencies(projectCfg.prjConfigYaml, projectCfg.dependenciesBuildDir);
//   // replace modules paths int require statements
//   //await replaceRequirePaths(projectCfg.compiledJsDir, projectCfg.moduleRoot);
//   // min prj
//   await minimize(projectCfg.compiledJsDir, projectCfg.minPrjDir);
//   // min deps
//   await minimize(projectCfg.dependenciesBuildDir, projectCfg.minDepsDir);
//   await prepareToFlash(
//     projectCfg.minPrjDir,
//     projectCfg.minDepsDir,
//     projectCfg.flashDir,
//     projectCfg.mainJsFileName,
//     projectCfg.moduleRoot
//   );
// });
//
// // upload project
// gulp.task('upload', async () => {
//   //const modules = await collectAppModules(projectCfg.minPrjDir, projectCfg.mainJsFileName, projectCfg.moduleRoot);
//
//   await uploadToFlash(
//     envConfig.board,
//     envConfig.port,
//     envConfig.portSpeed,
//     projectCfg.flashDir
//   );
// });
//
// // build and upload project
// gulp.task('prj', gulp.series('build', 'upload'), async () => {
// });
