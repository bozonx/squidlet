import Starter from './Starter';
//import FlashingReceiver from './FlashingReceiver';
import LogEmitter from './LogEmitter';


function init() {
  const logEmitter = new LogEmitter();
  const starter = new Starter(logEmitter);
  //const flashingReceiver = new FlashingReceiver(logEmitter);

  console.log(1111111111);

  starter.start()
    .catch((err: any) => logEmitter.error(err));
  // flashingReceiver.start()
  //   .catch((err: any) => logEmitter.error(err));
}

init();
