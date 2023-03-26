import Context from 'src/system/Context';
import ModBusMasterRtu from '../../squidlet-networking/src/io/nodejs/ios/ModBusMasterRtu';
import {ModbusMaster} from '../../squidlet-networking/src/drivers/ModbusMaster/ModbusMaster';
import EntityDefinition from '../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityDefinition.js';
import {PORT_EXPANDER_INPUT_RESISTOR_MODE} from './portExpander/services/IoSetPortExpander/constants';
import ModbusMasterConnection from '../../../../../../mnt/disk2/workspace/squidlet-networking/src/bridges/__old/ModbusMasterConnection/ModbusMasterConnection.js';
import {SemiDuplexFeedback} from './__old/entities/drivers/SemiDuplexFeedback/SemiDuplexFeedback';


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

  const outputPinNumber: number = 12;
  ////////////////// Do things
  const inputPinNumber: number = 11;

  connection.onIncomeMessage(async (channel: number, payload: Uint8Array) => {
    const ledState = payload[1] !== 8;

    await connection.send(11, new Uint8Array([
      outputPinNumber,
      Number(ledState)
    ]));
  });

  await connection.send(10, new Uint8Array([outputPinNumber]));
  await connection.send(12, new Uint8Array([inputPinNumber, PORT_EXPANDER_INPUT_RESISTOR_MODE.pullup]));

  // await connection.send(11, new Uint8Array([
  //   outputPinNumber,
  //   1
  // ]));








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

  // TODO: write не собирается в пакет, отправляется по одной

}

start()
  .catch(console.error);
