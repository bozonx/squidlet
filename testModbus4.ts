import Context from 'system/Context';
import ModBusMasterRtu from './platforms/nodejs/ios/ModBusMasterRtu';
import {ModbusMaster} from './entities/drivers/ModbusMaster/ModbusMaster';
import EntityDefinition from './system/interfaces/EntityDefinition';
import PollOnceModbus from './portExpander/services/PortExpander/PollOnceModbus';
import {FunctionHandler} from './system/lib/remoteFunctionProtocol/PollOnceBase';


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

  await masterIo.configure({
    ports: {
      0: {
        dev: '/dev/ttyUSB1',
        baudRate: 9600,
        parity: 'none',
        databits: 8,
        stopbits: 1,
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

  pollOnce.addEventListener(handler);
  await pollOnce.pollOnce();


  // const pinNumber: number = 12;
  // const pinState: boolean = true;

  // const result: Uint16Array = await modbusMasterDriver
  //   .readInputRegisters(0, 4);
  //
  // console.log(22222222, result);

  // client.writeMultipleRegisters(0x00, pinSetupMessage)
  //   .then((data: any) => console.log('writing result ', data))
  //   .catch(handleErrors);
  //
  // setTimeout(() => {
  //   client.writeMultipleRegisters(0x00, pinWriteMessage)
  //     .then((data: any) => console.log('writing result ', data))
  //     .catch(handleErrors);
  // }, 100);

}

start()
  .catch(console.error);
