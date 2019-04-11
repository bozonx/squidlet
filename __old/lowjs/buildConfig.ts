
// TODO: remove


import * as path from 'path';
import BuildConfig from '../../hostEnvBuilder/interfaces/BuildConfig';


export default function makeBuildConfig (rootDir: string, buildDir: string): BuildConfig {

  return {
    devsModernDst: path.resolve(buildDir, `./_devs_modern`),
    devsLegacyDst: path.resolve(buildDir, `./_devs_legacy`),
    devsMinDst: path.resolve(buildDir, `./_devs_min`),
    devsSrc: path.resolve(rootDir, './devs'),
  };
}
