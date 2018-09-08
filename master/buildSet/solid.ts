// solid set builds all the configs and entities files into host config

import {getPlatformIndex, PlatformIndex} from './_helper';


function init() {
  let platformIndex: PlatformIndex;

  try {
    platformIndex = getPlatformIndex();
  }
  catch (err) {
    return console.error(err);
  }

  // TODO: передать ему свой конфиг
}


init();
