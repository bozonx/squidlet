// solid set builds all the configs and entities files into host config

import generateMasterSet from './generateMasterSet';
import HostConfig from '../../host/src/app/interfaces/HostConfig';
import * as yargs from 'yargs';
import * as ts from 'gulp-typescript';
import generateHostSet from './generateHostSet';


// solid - build all in one file (system, host config, platform devs and config, entities files)
// * it receives name of host(default is master), host config(includes platform name)
// * it generates host configs set and put it to build
export default async function (hostConfig: HostConfig) {
  const hostSet = generateHostSet(hostConfig);
  const platformName: string = masterSet.platform;


  // TODO: сбилдить запускательный файл
  // TODO: склеить запускательный файл, систему(уже сбилженную), конфиги и файлы entities
  // TODO: ??? как сбилдить файлы entitites??? они должны браться из файлов, но вставляться в структуру


  const hostId: string = yargs.argv.name || 'master';
  const hostConfigFile: string = yargs.argv.config;


  const tsProject = ts.createProject('tsconfig.json');


}

// import {getPlatformIndex, PlatformIndex} from './_helper';
//
//
// function init() {
//   let platformIndex: PlatformIndex;
//
//   try {
//     platformIndex = getPlatformIndex();
//   }
//   catch (err) {
//     return console.error(err);
//   }
//
//   // TODO: передать ему свой конфиг
// }
//
//
// init();
