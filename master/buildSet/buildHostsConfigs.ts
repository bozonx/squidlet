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
