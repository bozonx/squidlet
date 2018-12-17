const path = require('path');
const fs = require('fs');
const gulp = require('gulp');
const yaml = require('js-yaml');

const {clearDir} = require('./buildHelpers/helpers');
const compileJs = require('./buildHelpers/compileJs');
const compileTs = require('./buildHelpers/compileTs');
const makeBundle = require('./buildHelpers/makeBundle');
const {collectDependencies} = require('./buildHelpers/collectDependencies');


// TODO: review - make paths for project

const envConfig = yaml.load(fs.readFileSync('env-config.yaml'));
const srcDirFull = path.resolve(__dirname, envConfig.src);
const buildDir = path.resolve(__dirname, envConfig.dst);
const compiledTsDir = path.join(buildDir, 'compiled-ts');
const compiledJsDir = path.join(buildDir, 'compiled-js');
const dependenciesBuildDir = path.join(buildDir, 'deps');
const mainJsFilePath = path.resolve(compiledJsDir, `${envConfig.main}.js`);
const espReadyBundleFileName = path.join(buildDir, 'bundle.js');
const buildConfigYaml = envConfig.prjConfig;



// build and upload starter
gulp.task('build-starter', async () => {
  clearDir(buildDir);
  await compileTs(srcDirFull, compiledTsDir);
  await compileJs(compiledTsDir, compiledJsDir);
  await collectDependencies(buildConfigYaml, dependenciesBuildDir);
  await makeBundle(compiledJsDir, dependenciesBuildDir, mainJsFilePath, espReadyBundleFileName);
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
