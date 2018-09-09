import * as path from 'path';

import Main from '../Main';
import { loadYamlFile } from '../IO';


export default async function (masterConfigFilePath: string, buildMaster: boolean = false) {
  if (!masterConfigFilePath) {
    console.error(`You have to specify a "--config" param`);

    process.exit(3);
  }

  const resolvedPath = path.resolve(process.cwd(), masterConfigFilePath);
  const configJs = await loadYamlFile(resolvedPath);

  const configurator = new Main(configJs, resolvedPath, buildMaster);

  try {
    await configurator.start();
  }
  catch (err) {
    console.error(err.toString());

    process.exit(2);
  }

}
