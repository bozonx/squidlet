import * as rollup from 'rollup';
import {ModuleFormat, OutputOptions, RollupOptions} from 'rollup';
import * as sourceMaps from 'rollup-plugin-sourcemaps';
import * as json from 'rollup-plugin-json';
import { terser } from 'rollup-plugin-terser';

const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const typescript = require('rollup-plugin-typescript2');
const babel = require('rollup-plugin-babel');
const { DEFAULT_EXTENSIONS } = require('@babel/core');


function makePlugins(useSourceMaps?: boolean, minimize?: boolean): any[] {
  return [
    // // replace config
    // replace({
    //   __BUILD_CONFIG__: JSON.stringify({
    //     envName: process.env.ENV_CONF,
    //     NODE_ENV: process.env.NODE_ENV,
    //     envConfig,
    //   })
    // }),
    // Allow bundling cjs modules
    resolve({
      extensions: ['.ts', '.js'],
    }),
    // Allow node_modules resolution
    commonjs({
      include: 'node_modules/**'
    }),
    typescript({
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        compilerOptions: {
          module: 'ESNext',
        }
      }
    }),

    babel({
      extensions: [ ...DEFAULT_EXTENSIONS, '.ts', '.js' ],
    }),

    // Allow json resolution
    json(),

    // Resolve source maps to the original source
    useSourceMaps && sourceMaps(),
    // minimize
    minimize && terser(),
  ];
}


export default async function(
  name: string,
  indexFilePath: string,
  outputFilePath: string,
  globals?: {[index: string]: string},
  external?: string[],
  useSourceMaps?: boolean,
  minimize?: boolean,
) {
  const inputOptions: RollupOptions = {
    input: indexFilePath,
    external,
    plugins: makePlugins(useSourceMaps, minimize),
  };
  // create a bundle
  const bundle = await rollup.rollup(inputOptions);
  const format: ModuleFormat = 'umd';
  const outputOptions: OutputOptions = {
    name,
    file: outputFilePath,
    format,
    sourcemap: useSourceMaps,
    globals,
  };

  // generate code
  //const { output } = await bundle.generate(outputOptions);

  // or write the bundle to disk
  await bundle.write(outputOptions);
}
