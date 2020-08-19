import * as path from 'path';
import * as gulp from 'gulp';
import babel from 'gulp-babel';


/**
 * compile typescript and make espruino compatible javascript code
 */
export default function compileJs (srcDir: string, destDir: string, strictMode?: boolean) {
  return new Promise((resolve, reject) => {
    return gulp
      .src(path.resolve(srcDir, `**/*.js`))
      .pipe(babel({
        // presets: [
        //   '@babel/preset-typescript',
        // ],
        plugins: [
          // plugins from node 4.0 env
          // * without "transform-arrow-functions" - they are supported on Espruino
          // * without "transform-block-scoping"
          // * without "transform-function-name"
          // * without "transform-for-of"
          // * without "transform-async-to-generator", "@babel/plugin-transform-regenerator" and "proposal-async-generator-functions"

          '@babel/plugin-transform-dotall-regex',
          '@babel/plugin-proposal-unicode-property-regex',
          '@babel/plugin-transform-sticky-regex',
          '@babel/plugin-transform-unicode-regex',
          '@babel/plugin-transform-exponentiation-operator',
          '@babel/plugin-transform-object-super',
          '@babel/plugin-transform-new-target',
          '@babel/plugin-proposal-class-properties',
          '@babel/plugin-proposal-optional-catch-binding',
          '@babel/plugin-proposal-json-strings',
          '@babel/plugin-proposal-object-rest-spread',
          '@babel/plugin-transform-destructuring',
          '@babel/plugin-transform-parameters',
          '@babel/plugin-transform-spread',

          '@babel/plugin-proposal-optional-chaining',

          // it isn't need for espruino 2.0, but compiler emits errors
          '@babel/plugin-transform-classes',

          ['@babel/plugin-transform-modules-commonjs', {
            // // removes "exports.__esModule = true;"
            // //strict: true,
            // // if true - it uses "exports.__esModule = true;" instead Object.defineProperty...
            // loose: true,
            // // if true - remove interop helper
            // noInterop: true,
            //
            // add/remove strict mode
            strictMode: strictMode,
            // allowCommonJSExports: false,
            // lazy: false,
            // allowTopLevelThis: false,
          }],

          [
            '@babel/plugin-transform-runtime',
            {
              //"corejs": true,
              // if false it put definition into files. If true - make requires
              //helpers: false,
              //regenerator: true,
              //useESModules: false,
            }
          ],

          // '@babel/plugin-transform-async-to-generator',
          // '@babel/plugin-transform-regenerator',
          // '@babel/plugin-proposal-async-generator-functions',
          'transform-async-to-promises',
        ],
      } as any))
      .pipe(gulp.dest(destDir))
      .on('error', reject)
      .on('end', resolve);
  });
}
