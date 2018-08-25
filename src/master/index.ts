/**
 * run `tsc ./index.ts --config ./myConfigFile.yaml`
 */
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

// TODO: add help

const argv = require('yargs').argv;

import Configurator from './Configurator';

function resolveMasterConfig() {
  if (!argv.config) {
    throw new Error(`You have to specify a "--config" param`);
  }

  const resolvedPath = path.resolve(argv.config);
  const yamlString = fs.readFileSync(resolvedPath, 'utf8');

  return yaml.safeLoad(yamlString);
}

async function init() {
  const configurator = new Configurator(resolveMasterConfig());

  await configurator.init();

  // TODO: start local host
}

init()
  .catch((err) => {
    throw new Error(err);
  });
