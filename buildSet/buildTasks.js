const path = require('path');
const gulp = require('gulp');
const babel = require('gulp-babel');



module.exports = {

  /**
   * compile typescript and make espruino compatible javascript code
   */
  compileTs: (srcDir, destDir) => {
    return new Promise((resolve, reject) => {
      return gulp
        .src(path.resolve(srcDir, `**/*.ts`))
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
                "useESModules": false,
              }
            ],

            'transform-async-to-promises',
          ],
        }))
        .pipe(gulp.dest(destDir))
        .on('error', reject)
        .on('end', resolve);
    });
  },


};
