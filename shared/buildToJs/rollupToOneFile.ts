import * as rollup from 'rollup';
import {ModuleFormat} from 'rollup';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import * as sourceMaps from 'rollup-plugin-sourcemaps';
import * as json from 'rollup-plugin-json';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import {OutputOptions} from 'rollup';

const babel = require('rollup-plugin-babel');


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
    typescript({
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        compilerOptions: {
          module: 'ESNext',
        }
      }
    }),
    // Allow json resolution
    json(),

    // Allow node_modules resolution
    commonjs({
      include: 'node_modules/**'
    }),
    babel({
      extensions: ['.ts', '.js'],
    }),
    // Allow bundling cjs modules
    resolve({
      extensions: ['.ts', '.js'],
    }),
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
  const inputOptions = {
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
