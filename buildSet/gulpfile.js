// require('ts-node/register');
// require('./tasks.ts');

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
const log = require('fancy-log');
const {collectDependencies, prependDepsToBundle} = require('./collectDependencies');

const envConfig = yaml.load(fs.readFileSync('env-config.yaml'));

const mainFileName = 'index';
const srcDir = './starterMc';
const srcDirFull = path.resolve(__dirname, srcDir);
const buildDirName = 'build/starter';
const buildDir = path.resolve(__dirname, buildDirName);
const compiledDir = path.join(buildDir, 'compiled');
const dependenciesBuildDir = path.join(buildDir, 'deps');
//const compiledTsDir = path.join(buildDir, 'compiledTs');
//const compiledJsDir = path.join(buildDir, 'compiledJs');
const mainJsFilePath = path.resolve(compiledDir, `${mainFileName}.js`);
const espReadyBundleFileName = path.join(buildDir, 'bundle.js');

// TODO: get from yargs

const buildConfigYaml = './starterMc/buildConfig.yaml';

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

// gulp.task('compile-babel', () => {
//   return gulp
//     .src(path.resolve(compiledTsDir, `**/*.js`))
//     .pipe(babel({
//       presets: [[
//         '@babel/env',
//         {
//           targets: {
//             esmodules: false,
//             // minimum support of promises (6.4) and classes (5.0)
//             node: '5.0',
//             // it uses unsupported arguments spread
//             //node: '6.5',
//           },
//           modules: 'commonjs',
//           useBuiltIns: 'usage',
//         }
//       ]],
//       plugins: [
//         //'transform-remove-strict-mode',
//         'transform-async-to-promises',
//         [
//           "@babel/plugin-transform-runtime",
//           {
//             //"corejs": true,
//             //"helpers": true,
//             // "regenerator": true,
//             "useESModules": false
//           }
//         ]
//       ],
//       //strictMode: false,
//     }))
//     .pipe(gulp.dest(compiledJsDir))
// });

// , 'content-to-dist'

gulp.task('prepare-for-espruino', (cb) => {
  if (!fs.existsSync(mainJsFilePath)) {
    cb('main app file does not exit ' + mainJsFilePath);
    return;
  }

  // esp.init(() => {
  //   Espruino.Config.BAUD_RATE = String(envConfig.port_speed);
  //   //Espruino.Config.BLUETOOTH_LOW_ENERGY  = false;
  //   Espruino.Config.BOARD_JSON_URL  = 'http://www.espruino.com/json/ESP32.json';
  //   Espruino.Config.MINIFICATION_LEVEL = 'ESPRIMA';
  //   Espruino.Config.MODULE_MINIFICATION_LEVEL = 'ESPRIMA';
  //
  //   esp.sendFile(envConfig.port, espReadyBundleFileName, function(err) {
  //     cb(err);
  //   })
  // });

  // TODO: review
  // let appContent = fs.readFileSync(mainJsFilePath).toString();
  // appContent = appContent.replace('Object.defineProperty(exports, "__esModule", { value: true });', '');
  // fs.writeFileSync(mainJsFilePath, appContent);

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


// ./node_modules/.bin/espruino --board ESP32 --port /dev/ttyUSB0 -b 115200 --no-ble -m -t ./build/starter/bundle.js
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
