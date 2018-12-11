// require('ts-node/register');
// require('./tasks.ts');

const gulp = require('gulp');
const ts = require('gulp-typescript');
const fs = require('fs');
const { fork } = require('child_process');
const path = require('path');
const yaml = require('js-yaml');
const _ = require('lodash');

const envConfig = yaml.load(fs.readFileSync('env-config.yaml'));

const mainFileName = 'index';
const srcDir = './starterMc';
const buildDirName = 'build/starter';
const buildDir = path.resolve(__dirname, buildDirName);
const compiledTsDir = path.join(buildDir, 'compiledTs');
const mainJsFilePath = path.resolve(compiledTsDir, `${mainFileName}.js`);

const espReadyBundleFileName = 'bundle.js';

// const distDir = './dist';
// const appFileName = 'index.js';
// const appFilePath = path.join(distDir, appFileName);


// const appConfigTsFileName = 'app-config.ts';
// const appConfigFileName = 'app-config.yaml';
// const userAppConfigFileName = 'app-config.user.yaml';

const tsProject = ts.createProject('tsconfig-builder.json', {
  // rootDir: [path.resolve(__dirname, './starterMc')],
  // outDir: compiledTsDir,
  //outDir: 'cccc',
  //outFile: 'index.js',
});


gulp.task('build', ['prepare-for-espruino']);

// , 'content-to-dist'

gulp.task('prepare-for-espruino', ['compile-ts'], (cb) => {
  if (!fs.existsSync(mainJsFilePath)) {
    cb('main app file does not exit ' + mainJsFilePath);
    return;
  }

  let appContent = fs.readFileSync(mainJsFilePath).toString();
  appContent = appContent.replace('Object.defineProperty(exports, "__esModule", { value: true });', '');
  fs.writeFileSync(mainJsFilePath, appContent);

  const buildproc = fork(
    require.resolve('espruino/bin/espruino-cli'),
    ['--board', envConfig.board, mainJsFilePath, '-o', espReadyBundleFileName],
    { cwd: compiledTsDir });

  buildproc.on('close', (code) => {
    cb();
  });
});

//, ['gen-config-ts']
gulp.task('compile-ts', function () {
  return tsProject.src().pipe(tsProject())
    .js.pipe(gulp.dest(compiledTsDir));
});

// gulp.task('content-to-dist', () => {
//   return gulp
//     //, { base: 'src' }
//     .src(path.join(compiledTsDir, '/**/*.js'))
//     .pipe(gulp.dest(distDir));
// });

// gulp.task('gen-config-ts', (cb) => {
//   if (!fs.existsSync(userAppConfigFileName)) {
//     const content = fs.readFileSync(appConfigFileName)
//       .toString()
//       .split('\n')
//       .map(x => `# ${x}`)
//       .join('\n');
//
//     fs.writeFileSync(userAppConfigFileName, content, { encoding: 'utf-8' });
//   }
//
//   const appConfig = yaml.load(fs.readFileSync(appConfigFileName));
//   const userAppConfig = yaml.load(fs.readFileSync(userAppConfigFileName));
//   const mergedAppConfig = _.assign(appConfig, userAppConfig);
//   const jsonString = JSON.stringify(mergedAppConfig);
//   const resultConfigTsContent = `export default ${jsonString};`;
//   fs.writeFileSync(path.join(srcDir, appConfigTsFileName), resultConfigTsContent);
//   cb();
// });

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
