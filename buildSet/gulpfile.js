const path = require('path');
const fs = require('fs');
const gulp = require('gulp');
const yaml = require('js-yaml');

const {projectConfig, clearDir} = require('./buildHelpers/helpers');
const compileJs = require('./buildHelpers/compileJs');
const compileTs = require('./buildHelpers/compileTs');
const makeBundle = require('./buildHelpers/makeBundle');
const {collectDependencies} = require('./buildHelpers/collectDependencies');


// TODO: review - make paths for project

const envConfig = yaml.load(fs.readFileSync('env-config.yaml'));
const starterCfg = projectConfig(envConfig.starter);


// build and upload starter
gulp.task('build-starter', async () => {
  clearDir(starterCfg.buildDir);
  await compileTs(starterCfg.srcDir, starterCfg.compiledTsDir);
  await compileJs(starterCfg.compiledTsDir, starterCfg.compiledJsDir, starterCfg.strictMode);
  await collectDependencies(starterCfg.prjConfigYaml, starterCfg.dependenciesBuildDir);
  await makeBundle(
    starterCfg.compiledJsDir,
    starterCfg.dependenciesBuildDir,
    starterCfg.mainJsFile, starterCfg.bundleFile
  );
});

gulp.task('upload-starter', async () => {
  // TODO: upload
});

gulp.task('starter', gulp.series('build-starter', 'upload-starter'), async () => {
});


// build project
gulp.task('build', async () => {
  // TODO: clear, compileTs, compileJs, collectDependencies, makeBundle
});

// upload project
gulp.task('upload', async () => {
  // TODO: upload
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
