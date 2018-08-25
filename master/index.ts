/**
 * run `ts-node ./index.ts --config ./myConfigFile.yaml`
 */
import * as path from 'path';
import * as fs from 'fs';
import * as yargs from 'yargs';

import Configurator from './Configurator';
import { yamlToJs } from './IO';

// TODO: add help

function resolveMasterConfig() {
  if (!yargs.argv.config) {
    throw new Error(`You have to specify a "--config" param`);
  }

  const resolvedPath = path.resolve(yargs.argv.config);
  const yamlString = fs.readFileSync(resolvedPath, 'utf8');

  return yamlToJs(yamlString);
}


const configurator = new Configurator(resolveMasterConfig());

configurator.init()
  .catch((err) => {
    throw new Error(err);
  });
