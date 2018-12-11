// require('ts-node/register');
// require('./tasks.ts');

const gulp = require('gulp');
const ts = require('gulp-typescript');
const babel = require('gulp-babel');
const fs = require('fs');
const { fork } = require('child_process');
const path = require('path');
const yaml = require('js-yaml');
const _ = require('lodash');
const log = require('fancy-log');

const envConfig = yaml.load(fs.readFileSync('env-config.yaml'));

const mainFileName = 'index';
const srcDir = './starterMc';
const buildDirName = 'build/starter';
const buildDir = path.resolve(__dirname, buildDirName);
const compiledTsDir = path.join(buildDir, 'compiledTs');
const compiledJsDir = path.join(buildDir, 'compiledJs');
const mainJsFilePath = path.resolve(compiledJsDir, `${mainFileName}.js`);
const espReadyBundleFileName = path.join(buildDir, 'bundle.js');

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

//, ['gen-config-ts']
gulp.task('compile-ts', () => {

  // const tsResult = tsProject.src().pipe(tsProject());
  // return tsResult.js.pipe(gulp.dest(compiledTsDir));

  return tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest(compiledTsDir));
});

gulp.task('compile-babel', () => {
  return gulp
    .src(path.resolve(compiledTsDir, `**/*.js`))
    .pipe(babel({
      presets: [[
        '@babel/env',
        {
          targets: {
            esmodules: false,
            // minimum support of promises (6.4) and classes (5.0)
            node: '5.0',
            // it uses unsupported arguments spread
            //node: '6.5',
          },
          modules: 'commonjs',
          useBuiltIns: 'usage',
        }
      ]],
      plugins: [
        //'transform-remove-strict-mode',
        'transform-async-to-promises',
        [
          "@babel/plugin-transform-runtime",
          {
            //"corejs": true,
            //"helpers": true,
            // "regenerator": true,
            "useESModules": false
          }
        ]
      ],
      //strictMode: false,
    }))
    .pipe(gulp.dest(compiledJsDir))
});

// , 'content-to-dist'

gulp.task('prepare-for-espruino', (cb) => {
  if (!fs.existsSync(mainJsFilePath)) {
    cb('main app file does not exit ' + mainJsFilePath);
    return;
  }

  // TODO: review
  // let appContent = fs.readFileSync(mainJsFilePath).toString();
  // appContent = appContent.replace('Object.defineProperty(exports, "__esModule", { value: true });', '');
  // fs.writeFileSync(mainJsFilePath, appContent);

  const buildproc = fork(
    require.resolve('espruino/bin/espruino-cli'),
    [
      '--board', envConfig.board,
      mainJsFilePath, '-o',
      espReadyBundleFileName
    ],
    { cwd: compiledJsDir }
  );

  buildproc.on('close', (code) => {
    cb();
  });
});


gulp.task('build', gulp.series('compile-ts', 'compile-babel', 'prepare-for-espruino'), (cb) => {
  console.info('DONE!');

  cb();
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
