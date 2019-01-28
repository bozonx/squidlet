import * as path from 'path';
import BuildConfig from '../buildHostEnv/interfaces/BuildConfig';


export default function makeBuildConfig (rootDir: string): BuildConfig {
  const buildDir: string = path.resolve(rootDir, `./build`);

  return {
    buildDir,
    devsModersDst: path.resolve(buildDir, `./_devs_modern`),
    devsLegacyDst: path.resolve(buildDir, `./_devs_legacy`),
    devsSrc: path.resolve(rootDir, './devs'),
  };
}
