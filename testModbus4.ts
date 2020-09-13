import Context from 'system/Context';
import ModBusMasterRtu from './platforms/nodejs/ios/ModBusMasterRtu';
import {ModbusMaster} from './entities/drivers/ModbusMaster/ModbusMaster';
import EntityDefinition from './system/interfaces/EntityDefinition';
import PollOnceModbus from './portExpander/services/PortExpander/PollOnceModbus';
import {FunctionHandler} from './system/lib/remoteFunctionProtocol/PollOnceBase';
import CallFunctionModbus from './portExpander/services/PortExpander/CallFunctionModbus';
import {uint8ToNum} from './system/lib/binaryHelpers';


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
  const handler: FunctionHandler = (funcNum: number, returnData: Uint8Array) => {
    console.log('return of funcNum: ', funcNum, ', data is: ', returnData);

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

  const inputPinNumber: number = 11;

  // pollOnce.addEventListener(handler);
  // // setup input pin
  // // await callFunction.callFunction(
  // //   12,
  // //   // pin 11
  // //   new Uint8Array([inputPinNumber, PORT_EXPANDER_INPUT_REGISTER_MODE.pullup])
  // // );
  // // read pin
  // await pollOnce.pollOnce();



  //console.log(111, uint8ToNum(new Uint8Array([5, 0])))

  // TODO: не собирается в пакет, отправляется по одной

  const outputPinNumber: number = 12;
  let pinState: number = 0;

  callFunction.callFunction(
    10,
    new Uint8Array([outputPinNumber])
  );

  while(true) {
    pinState = (pinState) ? 0 : 1;

    await callFunction.callFunction(
      11,
      new Uint8Array([outputPinNumber, pinState])
    );
    await (new Promise((resolve => setTimeout(resolve, 1000))));
  }

}

start()
  .catch(console.error);
