import * as fs from 'fs';


import Starter from './Starter';
import FlashingReceiver from './FlashingReceiver';
import LogEmitter from './LogEmitter';


function init() {
  const starter = new Starter();
  const flashingReceiver = new FlashingReceiver();
  const logEmitter = new LogEmitter();


}

init();
