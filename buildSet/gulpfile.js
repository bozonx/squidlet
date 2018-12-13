const { fork } = require('child_process');
const path = require('path');
const fs = require('fs');
const gulp = require('gulp');
const babel = require('gulp-babel');
const shelljs = require('shelljs');
const yaml = require('js-yaml');
const esp = require("espruino");
const _ = require('lodash');

const {collectDependencies, prependDepsToBundle} = require('./collectDependencies');


const envConfig = yaml.load(fs.readFileSync('env-config.yaml'));
const srcDirFull = path.resolve(__dirname, envConfig.src);
const buildDir = path.resolve(__dirname, envConfig.dst);
const compiledDir = path.join(buildDir, 'compiled');
const dependenciesBuildDir = path.join(buildDir, 'deps');
const mainJsFilePath = path.resolve(compiledDir, `${envConfig.main}.js`);
const espReadyBundleFileName = path.join(buildDir, 'bundle.js');
const buildConfigYaml = envConfig.prjConfig;


// compile typescript and make espruino compatible javascript code
gulp.task('compile', () => {
  return gulp
    .src(path.resolve(srcDirFull, `**/*.ts`))
    .pipe(babel({
      presets: [
        '@babel/preset-typescript',
      ],
      plugins: [
        // plugins from node 4.0 env
        // * without "transform-arrow-functions" - they are supported on Espruino
        // * without "transform-async-to-generator", "@babel/plugin-transform-regenerator" and "proposal-async-generator-functions"

        // '@babel/plugin-transform-async-to-generator',
        // '@babel/plugin-transform-regenerator',
        //'@babel/plugin-proposal-async-generator-functions',

        '@babel/plugin-transform-dotall-regex',
        '@babel/plugin-proposal-unicode-property-regex',
        '@babel/plugin-transform-sticky-regex',
        '@babel/plugin-transform-unicode-regex',
        '@babel/plugin-transform-exponentiation-operator',
        '@babel/plugin-proposal-json-strings',
        '@babel/plugin-proposal-optional-catch-binding',
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-transform-destructuring',
        '@babel/plugin-transform-function-name',
        '@babel/plugin-transform-for-of',
        '@babel/plugin-transform-parameters',
        '@babel/plugin-transform-block-scoping',
        '@babel/plugin-transform-spread',
        '@babel/plugin-transform-object-super',
        '@babel/plugin-transform-new-target',
        '@babel/plugin-proposal-class-properties',
        // it isn't need for espruino 2.0, but compiler emits errors
        '@babel/plugin-transform-classes',

        ['@babel/plugin-transform-modules-commonjs', {
          // removes "exports.__esModule = true;"
          //strict: true,
          // if true - it uses "exports.__esModule = true;"
          loose: true,
          //noInterop: true,
        }],

        // TODO: does it really need ?
        [
          "@babel/plugin-transform-runtime",
          {
            //"corejs": true,
            // if false it put definition into files. If true - make requires
            //helpers: false,
            // "regenerator": true,
            "useESModules": false
          }
        ],

        'transform-async-to-promises',
      ],
    }))
    .pipe(gulp.dest(compiledDir))
});

// make bundle for espruino. Files which are required will be prepended to bundle as Modules.addCached(...)
gulp.task('bundle', (cb) => {
  if (!fs.existsSync(mainJsFilePath)) {
    cb('main app file does not exit ' + mainJsFilePath);
    return;
  }

  const buildproc = fork(
    require.resolve('espruino/bin/espruino-cli'),
    _.compact([
      '--board', envConfig.board,
      envConfig.minimize && '-m',
      mainJsFilePath, '-o',
      espReadyBundleFileName
    ]),
    { cwd: compiledDir }
  );

  buildproc.on('close', (code) => {
    cb();
  });
});

// collect dependencies and write them to the beginning of bundle file
gulp.task('dependencies', async () => {
  await collectDependencies(buildConfigYaml, dependenciesBuildDir);
  await prependDepsToBundle(dependenciesBuildDir, espReadyBundleFileName);
});

// clear build dir
gulp.task('clear', async () => {
  shelljs.rm('-rf', path.join(buildDir, '*'));
});

// full build
gulp.task('build', gulp.series('clear', 'compile', 'bundle', 'dependencies'), (cb) => {
  console.info('DONE!');

  cb();
});


// like ./node_modules/.bin/espruino --board ESP32 --port /dev/ttyUSB0 -b 115200 --no-ble -m -t ./build/starter/bundle.js
gulp.task('upload',  (cb) => {
  esp.init(() => {
    Espruino.Config.BAUD_RATE = String(envConfig.port_speed);
    Espruino.Config.BLUETOOTH_LOW_ENERGY  = false;
    Espruino.Config.SET_TIME_ON_WRITE  = true;
    Espruino.Config.BOARD_JSON_URL = `http://www.espruino.com/json/${envConfig.board}.json`;
    // Espruino.Config.MINIFICATION_LEVEL = 'ESPRIMA';
    // Espruino.Config.MODULE_MINIFICATION_LEVEL = 'ESPRIMA';

    esp.sendFile(envConfig.port, espReadyBundleFileName, function(err) {
      cb(err);
    })
  });
});


// const tsProject = ts.createProject('tsconfig-builder.json', {
//   // rootDir: [path.resolve(__dirname, './starterMc')],
//   // outDir: compiledTsDir,
//   //outDir: 'cccc',
//   //outFile: 'index.js',
// });

// gulp.on('all',function (e, r) {
//   console.log(1111, e,r)
// });

// //, ['gen-config-ts']
// gulp.task('compile-ts', () => {
//
//   // const tsResult = tsProject.src().pipe(tsProject());
//   // return tsResult.js.pipe(gulp.dest(compiledTsDir));
//
//   return tsProject.src()
//     .pipe(tsProject())
//     .js.pipe(gulp.dest(compiledTsDir));
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
