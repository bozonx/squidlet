import Context from 'system/Context';
import ModBusMasterRtu from './platforms/nodejs/ios/ModBusMasterRtu';
import {ModbusMaster} from './entities/drivers/ModbusMaster/ModbusMaster';
import EntityDefinition from './system/interfaces/EntityDefinition';
import {FunctionHandler} from './system/lib/remoteFunctionProtocol/PollOnceBase';
import CallFunctionModbus from './portExpander/services/PortExpander/CallFunctionModbus';
import {uint8ToNum} from './system/lib/binaryHelpers';
import {PORT_EXPANDER_INPUT_RESISTOR_MODE} from './portExpander/services/PortExpander/constants';
import ModbusMasterConnection from './entities/services/ModbusMasterConnection/ModbusMasterConnection';
import {SemiDuplexFeedback} from './entities/drivers/SemiDuplexFeedback/SemiDuplexFeedback';


async function start () {
  const masterIo: ModBusMasterRtu = new ModBusMasterRtu();
  const context: Context = {
    getIo() {
      return masterIo;
    },
    async getSubDriver(driverName: string, props: {[index: string]: any}): Promise<any> {
      if (driverName === 'SemiDuplexFeedback') {
        const driver = new SemiDuplexFeedback(context, {
          id: 'SemiDuplexFeedback',
          className: 'SemiDuplexFeedback',
          props,
        });

        await driver.init();

        return driver;
      }
      else if (driverName === 'ModbusMaster') {
        const driver = new ModbusMaster(context, {
          id: 'ModbusMaster',
          className: 'ModbusMaster',
          props,
        });

        await driver.init();

        return driver;
      }
    },
    log: {
      error: console.error,
      warn: console.warn,
    }
  } as any;
  const modbusConnectionDefinition: EntityDefinition = {
    id: 'ModbusConnectionDefinition',
    className: 'ModbusConnectionDefinition',
    props: {
      pollIntervalMs: 1000,
      portNum: '0',
      slaveId: 1,
    }
  };

  const connection = new ModbusMasterConnection(context, modbusConnectionDefinition);

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

  await connection.init();



  ////////////////// Do things
  const inputPinNumber: number = 11;
  const outputPinNumber: number = 12;

  await connection.send(10, new Uint8Array([outputPinNumber]));
  await connection.send(11, new Uint8Array([outputPinNumber, 1]));











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



  //
  // const handler: FunctionHandler = (funcNum: number, returnData: Uint8Array) => {
  //   console.log('return of funcNum: ', funcNum, ', data is: ', returnData);
  //
  //   callFunction.callFunction(
  //     11,
  //     new Uint8Array([outputPinNumber, (returnData[1]) ? 0 : 8])
  //   );
  //
  //   // if (!functionsParsers[functionNum]) {
  //   //   this.logWarn(
  //   //     `PollOnceLogic: Can't recognize the function handler: ${functionNum}`
  //   //   );
  //   //
  //   //   continue;
  //   // }
  //   //
  //   // let args: Results;
  //   //
  //   // try {
  //   //   args = functionsParsers[functionNum](data);
  //   // }
  //   // catch (e) {
  //   //   this.logWarn(
  //   //     `PollOnceLogic: an error occurred while parsing ` +
  //   //     `function ${functionNum} result: ${e}`
  //   //   );
  //   //
  //   //   continue;
  //   // }
  //
  // };
  //console.log(111, uint8ToNum(new Uint8Array([5, 0])))


  //////////////////// READ


  // pollOnce.addEventListener(handler);
  // // setup input pin
  // await callFunction.callFunction(
  //   12,
  //   // pin 11, 1
  //   new Uint8Array([inputPinNumber, PORT_EXPANDER_INPUT_RESISTOR_MODE.pullup])
  // );
  // await callFunction.callFunction(
  //   10,
  //   new Uint8Array([outputPinNumber])
  // );
  //
  // setInterval(() => {
  //   pollOnce.pollOnce();
  // }, 1000);


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
