import * as path from 'path';

import {HOST_TMP_HOST_DIR, HOST_VAR_DATA_DIR} from '../../shared/constants';
import Os, {SpawnCmdResult} from '../../shared/Os';
import Props from './Props';


export function makeSystemConfigExtend(props: Props): {[index: string]: any} {
  return {
    rootDirs: {
      envSet: props.envSetDir,
      varData: path.join(props.workDir, HOST_VAR_DATA_DIR),
      tmp: path.join(props.tmpDir, HOST_TMP_HOST_DIR),
    },
  };
}

export async function installNpmModules(os: Os, cwd: string) {
  const result: SpawnCmdResult = await os.spawnCmd('npm install', cwd);

  if (result.status) {
    throw new Error(`Can't install npm modules:\n${result.stderr}`);
  }
}
