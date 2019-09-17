import path from 'path';

import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import sourceMaps from 'rollup-plugin-sourcemaps';
import json from 'rollup-plugin-json';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import babel from 'rollup-plugin-babel';


export function makeOutputDefinition(envConfig, globals = {}) {
  const outputDir = path.resolve(__dirname, envConfig.buildDir);
  const resultJsFileName = 'app.js';

  return {
    file: `${outputDir}/${resultJsFileName}`,
    format: 'umd',
    sourcemap: envConfig.sourceMaps,
    globals: {
      ...globals,
    },
  };
}


export default function (envConfig) {
  return {
    // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
    //external: [],
    plugins: [
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
      envConfig.sourceMaps && sourceMaps(),
      // minimize
      envConfig.minimize && terser(),
    ],
  };
}
