/**
 * run `tsc ./standalone.ts --config ./myConfigFile.yaml`
 */

import Configurator from './Configurator';
import resolveMasterConfig from './resolveMasterConfig';

// TODO: add help

const configurator = new Configurator(resolveMasterConfig());

configurator.init()
  .catch((err) => {
    throw new Error(err);
  });
