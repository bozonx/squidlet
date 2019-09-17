import * as rollup from 'rollup';
import {ModuleFormat} from 'rollup';


export default async function(outputFilePath: string, globals?: string[], sourceMaps?: boolean) {
  // create a bundle
  const bundle = await rollup.rollup(inputOptions);
  const format: ModuleFormat = 'umd';
  const outputOptions = {
    file: outputFilePath,
    format,
    sourcemap: sourceMaps,
    globals: {
      ...globals,
    },
  };

  // generate code
  //const { output } = await bundle.generate(outputOptions);

  // or write the bundle to disk
  await bundle.write(outputOptions);
}
