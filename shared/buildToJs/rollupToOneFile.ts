import * as rollup from 'rollup';
import {ModuleFormat} from 'rollup';


export default async function(
  name: string,
  indexFilePath: string,
  outputFilePath: string,
  globals?: string[],
  external?: string[],
  sourceMaps?: boolean,
  minimize?: boolean,
) {
  // TODO: use minimize
  const inputOptions = {
    input: indexFilePath,
    external,
  };
  // create a bundle
  const bundle = await rollup.rollup(inputOptions);
  const format: ModuleFormat = 'umd';
  const outputOptions = {
    name,
    file: outputFilePath,
    format,
    sourcemap: sourceMaps,
    globals,
  };

  // generate code
  //const { output } = await bundle.generate(outputOptions);

  // or write the bundle to disk
  await bundle.write(outputOptions);
}
