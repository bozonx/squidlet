const fs = require('fs');
const gulp = require('gulp');
const yaml = require('js-yaml');

const {projectConfig, clearDir} = require('./buildHelpers/helpers');
const compileJs = require('./buildHelpers/compileJs');
const compileTs = require('./buildHelpers/compileTs');
const collectDependencies = require('./buildHelpers/collectDependencies');
const minimize = require('./buildHelpers/minimize');
const prepareToFlash = require('./buildHelpers/prepareToFlash');
const {uploadToFlash} = require('./buildHelpers/upload');


const envConfig = yaml.load(fs.readFileSync('env-config.yaml'));
const projectCfg = projectConfig(envConfig.project);


// host
gulp.task('build-host', async () => {
  clearDir(projectCfg.buildDir);
  await compileTs(projectCfg.srcDir, projectCfg.compiledTsDir);
  await compileJs(projectCfg.compiledTsDir, projectCfg.compiledJsDir, projectCfg.strictMode);
  await collectDependencies(projectCfg.prjConfigYaml, projectCfg.dependenciesBuildDir);
  // replace modules paths int require statements
  //await replaceRequirePaths(projectCfg.compiledJsDir, projectCfg.moduleRoot);
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

// upload project
gulp.task('upload', async () => {
  //const modules = await collectAppModules(projectCfg.minPrjDir, projectCfg.mainJsFileName, projectCfg.moduleRoot);

  await uploadToFlash(
    envConfig.board,
    envConfig.port,
    envConfig.portSpeed,
    projectCfg.flashDir
  );
});

// build and upload project
gulp.task('prj', gulp.series('build', 'upload'), async () => {
});
