const gulp = require('gulp');
const ts = require('gulp-typescript');
const babel = require('gulp-babel');
const fs = require('fs');
const { fork } = require('child_process');
const path = require('path');
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


gulp.task('compile', () => {
  return gulp
    .src(path.resolve(srcDirFull, `**/*.ts`))
    .pipe(babel({
      presets: [
        '@babel/preset-typescript',
        // [
        //   '@babel/env',
        //   {
        //     targets: {
        //       esmodules: false,
        //       // minimum support of promises (6.4) and classes (5.0)
        //       //node: '5.0',
        //       // it uses unsupported arguments spread
        //       //node: '6.5',
        //       node: '4.0',
        //     },
        //     exclude: [
        //       'transform-regenerator',
        //       'transform-async-to-generator',
        //       //'proposal-async-generator-functions',
        //     ],
        //     // include: [
        //     //   'transform-function-name',
        //     //   'transform-arrow-functions',
        //     //   'transform-for-of',
        //     //   'transform-sticky-regex',
        //     //   'transform-unicode-regex',
        //     //   'transform-parameters',
        //     //   'transform-destructuring',
        //     //   'transform-block-scoping',
        //     //   //'transform-regenerator',
        //     // ],
        //     modules: 'commonjs',
        //     //useBuiltIns: 'usage',
        //     debug: true,
        //   }
        // ],
      ],
      plugins: [
        // plugins from node 4.0 env
        // * without "transform-arrow-functions" - they are supported on Espruino
        // * without "transform-async-to-generator" and "proposal-async-generator-functions"
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
        ['@babel/plugin-proposal-class-properties', {
          // true - don't use helpers, false - use helpers
          //"loose": true
        }],
        ['@babel/plugin-transform-classes', {
          // true - don't use helpers, false - use helpers
          //"loose": true
        }],

        ['@babel/plugin-transform-modules-commonjs', {
          // removes "exports.__esModule = true;"
          //strict: true,
          // if true - it uses "exports.__esModule = true;"
          loose: true,
          //noInterop: true,
        }],


        //transform-arrow-functions

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

        // ['babel-plugin-module-resolver', {
        //   "root": [srcDirFull, 'node_modules'],
        //   //"underscore": "lodash",
        //   //"lodash": "underscore",
        // }],
      ],
    }))
    .pipe(gulp.dest(compiledDir))
});

gulp.task('prepare-for-espruino', (cb) => {
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

gulp.task('dependencies', async () => {
  await collectDependencies(buildConfigYaml, dependenciesBuildDir);
  await prependDepsToBundle(dependenciesBuildDir, espReadyBundleFileName);
});

gulp.task('clear', async () => {
  shelljs.rm('-rf', path.join(buildDir, '*'));
});

gulp.task('build', gulp.series('clear', 'compile', 'prepare-for-espruino', 'dependencies'), (cb) => {
  console.info('DONE!');

  cb();
});


// like ./node_modules/.bin/espruino --board ESP32 --port /dev/ttyUSB0 -b 115200 --no-ble -m -t ./build/starter/bundle.js
gulp.task('upload',  (cb) => {
  esp.init(() => {
    Espruino.Config.BAUD_RATE = String(envConfig.port_speed);
    Espruino.Config.BLUETOOTH_LOW_ENERGY  = false;
    Espruino.Config.SET_TIME_ON_WRITE  = true;
    Espruino.Config.BOARD_JSON_URL  = 'http://www.espruino.com/json/ESP32.json';
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
