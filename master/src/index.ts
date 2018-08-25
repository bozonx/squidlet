/**
 * run `tsc ./index.ts --config ./myConfigFile.yaml`
 */
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as yargs from 'yargs';

import Configurator from './Configurator';

// TODO: add help

function resolveMasterConfig() {
  if (!yargs.argv.config) {
    throw new Error(`You have to specify a "--config" param`);
  }

  const resolvedPath = path.resolve(yargs.argv.config);
  const yamlString = fs.readFileSync(resolvedPath, 'utf8');

  return yaml.safeLoad(yamlString);
}

async function init() {
  const configurator = new Configurator(resolveMasterConfig());

  await configurator.init();
}

init()
  .catch((err) => {
    throw new Error(err);
  });
