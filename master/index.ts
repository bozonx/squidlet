/**
 * run `ts-node ./index.ts --config ./myConfigFile.yaml`
 */
import * as path from 'path';
import * as yargs from 'yargs';

import Main from './Main';
import { loadYamlFile } from './IO';

// TODO: add help


async function init() {
  if (!yargs.argv.config) {
    throw new Error(`You have to specify a "--config" param`);
  }

  const resolvedPath = path.resolve(yargs.argv.config);
  const configJs = await loadYamlFile(resolvedPath);
  const configurator = new Main(configJs);

  await configurator.start();
}

init()
  .catch((err) => {
    throw new Error(err);
  });
