import Context from 'src/system/Context';
import ModBusMasterRtu from '../../squidlet-networking/src/io/nodejs/ios/ModBusMasterRtu';
import {ModbusMaster} from '../../squidlet-networking/src/drivers/ModbusMaster/ModbusMaster';
import EntityDefinition from '../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityDefinition.js';
import {FunctionHandler} from './system/lib/remoteFunctionProtocol/PollOnceBase';
import CallFunctionModbus from './portExpander/services/IoSetPortExpander/CallFunctionModbus';
import {uint8ToNum} from '../../squidlet-lib/src/binaryHelpers';
import {PORT_EXPANDER_INPUT_RESISTOR_MODE} from './portExpander/services/IoSetPortExpander/constants';
import PollOnceModbus from '../../../../../../mnt/disk2/workspace/squidlet-networking/src/bridges/__old/ModbusMasterConnection/PollOnceModbus.js';


async function start () {
  const masterIo: ModBusMasterRtu = new ModBusMasterRtu();
  const context: Context = {
    getIo() {
      return masterIo;
    }
  } as any;
  const definition: EntityDefinition = {
    id: 'ModbusMaster',
    className: 'ModbusMaster',
    props: {
      portNum: 0,
      slaveId: 1,
    }
  };
  const modbusMasterDriver: ModbusMaster = new ModbusMaster(context, definition);
  const pollOnce = new PollOnceModbus(modbusMasterDriver, console.warn);
  const callFunction = new CallFunctionModbus(modbusMasterDriver);

  await masterIo.configure({
    ports: {
      0: {
        dev: '/dev/ttyUSB1',
        baudRate: 9600,
        parity: 'none',
        dataBits: 8,
        stopBits: 1,
      },
    },
  });
  await masterIo.init({
    log: {
      debug: console.log,
      info: console.log,
      warn: console.warn,
      error: console.error,
    }
  } as any);
  await modbusMasterDriver.init();



  ////////////////// Do things
  // setup i2c
  // await callFunction.callFunction(
  //   40,
  //   new Uint8Array([])
  // );
  //
  // await (new Promise((resolve => setTimeout(resolve, 100))));
  //
  // // await callFunction.callFunction(
  // //   41,
  // //   new Uint8Array([0, 0x41, 0x06, 0xc7, 0x07, 0x00, 0x08, 0xcc, 0x09, 0x04])
  // // );
  //
  // await callFunction.callFunction(
  //   41,
  //   new Uint8Array([0, 0x41, 0x06, 0xc7])
  // );
  //
  // await (new Promise((resolve => setTimeout(resolve, 100))));
  //
  // await callFunction.callFunction(
  //   41,
  //   new Uint8Array([0, 0x41, 0x07, 0x00])
  // );
  //
  // await (new Promise((resolve => setTimeout(resolve, 100))));
  //
  // await callFunction.callFunction(
  //   41,
  //   new Uint8Array([0, 0x41, 0x08, 0xcc])
  // );
  //
  // await (new Promise((resolve => setTimeout(resolve, 100))));
  //
  // await callFunction.callFunction(
  //   41,
  //   new Uint8Array([0, 0x41, 0x09, 0x04])
  // );


  const inputPinNumber: number = 11;
  const outputPinNumber: number = 12;

  const handler: FunctionHandler = (funcNum: number, returnData: Uint8Array) => {
    console.log('return of funcNum: ', funcNum, ', data is: ', returnData);

    callFunction.callFunction(
      11,
      new Uint8Array([outputPinNumber, (returnData[1]) ? 0 : 8])
    );

    // if (!functionsParsers[functionNum]) {
    //   this.logWarn(
    //     `PollOnceLogic: Can't recognize the function handler: ${functionNum}`
    //   );
    //
    //   continue;
    // }
    //
    // let args: Results;
    //
    // try {
    //   args = functionsParsers[functionNum](data);
    // }
    // catch (e) {
    //   this.logWarn(
    //     `PollOnceLogic: an error occurred while parsing ` +
    //     `function ${functionNum} result: ${e}`
    //   );
    //
    //   continue;
    // }

  };
  //console.log(111, uint8ToNum(new Uint8Array([5, 0])))


  //////////////////// READ


  pollOnce.addEventListener(handler);
  // setup input pin
  await callFunction.callFunction(
    12,
    // pin 11, 1
    new Uint8Array([inputPinNumber, PORT_EXPANDER_INPUT_RESISTOR_MODE.pullup])
  );
  await callFunction.callFunction(
    10,
    new Uint8Array([outputPinNumber])
  );

  setInterval(() => {
    pollOnce.pollOnce();
  }, 1000);


  // setTimeout(() => {
  //   // read pin
  //   pollOnce.pollOnce();
  // }, 500);



  ///////////////// WRITE

  //
  // let pinState: number = 0;
  //
  // callFunction.callFunction(
  //   10,
  //   new Uint8Array([outputPinNumber])
  // );
  //
  // while(true) {
  //   pinState = (pinState) ? 0 : 1;
  //
  //   await callFunction.callFunction(
  //     11,
  //     new Uint8Array([outputPinNumber, pinState])
  //   );
  //   await (new Promise((resolve => setTimeout(resolve, 1000))));
  // }

  // TODO: write не собирается в пакет, отправляется по одной

}

start()
  .catch(console.error);
