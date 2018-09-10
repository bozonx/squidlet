import * as path from 'path';

import Main from '../configWorks/Main';
import { loadYamlFile } from '../configWorks/IO';
import MasterConfig from '../configWorks/MasterConfig';
import HostsFilesWriter from '../configWorks/HostsFilesWriter';


// TODO: сбилдить все файлы хостов
// TODO: запусить запись всех файлов на диск


export default async function (config: MasterConfig, resolvedConfigPath: string, debug?: boolean) {
  const configWorks: Main = new Main(config, resolvedConfigPath);

  try {
    await configWorks.collect();
  }
  catch (err) {

    // TODO: если degug - то делать throw

    console.error(err.toString());

    process.exit(3);
  }

  const resolvedPath = path.resolve(yargs.argv.config);
  const configJs = await loadYamlFile(resolvedPath);
  const configurator = new Main(configJs, resolvedPath);

  await configurator.start();



  this.log.info(`Done!`);
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
