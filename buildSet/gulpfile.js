const fs = require('fs');
const gulp = require('gulp');
const yaml = require('js-yaml');

const {projectConfig, clearDir} = require('./buildHelpers/helpers');
const compileJs = require('./buildHelpers/compileJs');
const compileTs = require('./buildHelpers/compileTs');
const {makeBundle, collectAppModules} = require('./buildHelpers/makeBundle');
const collectDependencies = require('./buildHelpers/collectDependencies');
const minimize = require('./buildHelpers/minimize');
const replaceRequirePaths = require('./buildHelpers/replaceRequirePaths');
const {uploadBundle, uploadProject} = require('./buildHelpers/upload');


const envConfig = yaml.load(fs.readFileSync('env-config.yaml'));
const starterCfg = projectConfig(envConfig.starter);
const projectCfg = projectConfig(envConfig.project);


// starter
gulp.task('build-starter', async () => {
  clearDir(starterCfg.buildDir);
  await compileTs(starterCfg.srcDir, starterCfg.compiledTsDir);
  await compileJs(starterCfg.compiledTsDir, starterCfg.compiledJsDir, starterCfg.strictMode);
  await collectDependencies(starterCfg.prjConfigYaml, starterCfg.dependenciesBuildDir);
  // min prj
  await minimize(starterCfg.compiledJsDir, starterCfg.minPrjDir);
  // min deps
  await minimize(starterCfg.dependenciesBuildDir, starterCfg.minDepsDir);
  // replace modules paths int require statements
  await replaceRequirePaths(starterCfg.minPrjDir, starterCfg.moduleRoot);
  await makeBundle(
    starterCfg.minPrjDir,
    starterCfg.minDepsDir,
    starterCfg.mainJsFileName,
    starterCfg.bundleFile
  );
});

gulp.task('upload-starter', async () => {
  await uploadBundle(envConfig.board, envConfig.port, envConfig.portSpeed, starterCfg.bundleFile);
});

gulp.task('starter', gulp.series('build-starter', 'upload-starter'), async () => {
});


// project
gulp.task('build', async () => {
  clearDir(projectCfg.buildDir);
  await compileTs(projectCfg.srcDir, projectCfg.compiledTsDir);
  await compileJs(projectCfg.compiledTsDir, projectCfg.compiledJsDir, projectCfg.strictMode);
  await collectDependencies(projectCfg.prjConfigYaml, projectCfg.dependenciesBuildDir);
  // min prj
  await minimize(projectCfg.compiledJsDir, projectCfg.minPrjDir);
  // min deps
  await minimize(projectCfg.dependenciesBuildDir, projectCfg.minDepsDir);
  // replace modules paths int require statements
  await replaceRequirePaths(projectCfg.compiledJsDir, projectCfg.moduleRoot);
});

// upload project
gulp.task('upload', async () => {
  const modules = await collectAppModules(projectCfg.minPrjDir, projectCfg.mainJsFileName);

  await uploadProject(
    envConfig.board,
    envConfig.port,
    envConfig.portSpeed,
    modules
  );
});

// build and upload project
gulp.task('prj', gulp.series('build', 'upload'), async () => {
});




//////////////////////////


// gulp.task("send-to-espurino-console", (cb) => {
//   const content = fs.readFileSync(espReadyBundlePath);
//   fs.writeFile(
//     espConsoleBeingWatchedFilePath,
//     content,
//     (err) => {
//       if (err) { throw err; }
//       cb();
//     });
// });
//
// gulp.task("clear-espurino-watch-file", (cb) => {
//   fs.writeFile(
//     espConsoleBeingWatchedFilePath,
//     "",
//     (err) => {
//       if (err) { throw err; }
//       cb();
//     });
// });
//
// gulp.task("espruino-console", ["clear-espurino-watch-file"], (cb) => {
//   const buildproc = fork(
//     require.resolve("espruino/bin/espruino-cli"),
//     ["--board", envConfig.board, "-b", envConfig.port_speed, "--port", envConfig.port, "-w", espConsoleBeingWatchedFileName],
//     { cwd: distDir });
//   buildproc.on('close', (code) => {
//     cb();
//   });
// });
