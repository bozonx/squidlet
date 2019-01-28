import * as path from 'path';


export interface BuildConfig {
  buildDir: string;
  devsModersDst: string;
  devsLegacyDst: string;
  devsSrc: string;
}


export default function buildConfig (rootDir: string): BuildConfig {
  const buildDir: string = path.resolve(rootDir, `./build`);


  return {
    buildDir,
    devsModersDst: path.resolve(buildDir, `./_devs_modern`),
    devsLegacyDst: path.resolve(buildDir, `./_devs_legacy`),
    devsSrc: path.resolve(rootDir, './devs'),
  };
}
