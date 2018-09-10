import * as path from 'path';

import Main from '../Main';
import { loadYamlFile } from '../IO';
import MasterConfig from '../MasterConfig';


export default async function (config: MasterConfig, buildMaster: boolean = false) {
  const configurator = new Main(config, resolvedPath, buildMaster);

  try {
    await configurator.start();
  }
  catch (err) {
    console.error(err.toString());

    process.exit(2);
  }

}


// /**
//  * run `ts-node ./index.ts --config ./myConfigFile.yaml`
//  */
// import * as path from 'path';
//
// import Main from './Main';
// import { loadYamlFile } from './IO';
//
//
// yargs.help(`
// suqidlet-build --config ./path-to-my-config
// `);
//
//
// async function init() {
//   if (!yargs.argv.config) {
//     console.error(`You have to specify a "--config" param`);
//
//     process.exit(3);
//   }
//
//   const resolvedPath = path.resolve(yargs.argv.config);
//   const configJs = await loadYamlFile(resolvedPath);
//   const configurator = new Main(configJs, resolvedPath);
//
//   await configurator.start();
// }
//
// init()
//   .catch((err) => {
//     // TODO: наверное лучше просто console.error
//     //throw new Error(err);
//
//     console.error(err.toString())
//
//     process.exit(2);
//   });
