// solid set builds all the configs and entities files into host config

import generateMasterSet from './generateMasterSet';
import HostConfig from '../../host/src/app/interfaces/HostConfig';


export default async function (hostConfig: HostConfig) {

  // TODO: конфиг должен валидироваться в том числе и имя платформы


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
