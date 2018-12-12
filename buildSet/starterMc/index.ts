import Starter from './Starter';
//import FlashingReceiver from './FlashingReceiver';
import LogEmitter from './LogEmitter';

//import omit = require('lodash/omit');
//import omit from 'lodash/omit';
//import * as omit from 'lodash.omit';
//import * as lodash from 'lodash';


function init() {
  const logEmitter = new LogEmitter();
  const starter = new Starter(logEmitter);
  //const flashingReceiver = new FlashingReceiver(logEmitter);

  //console.log(1111111111, lodash.omit({a: 1, b: 2}), 'a');

  starter.start()
    .catch((err: any) => logEmitter.error(err));
  // flashingReceiver.start()
  //   .catch((err: any) => logEmitter.error(err));
}

init();
