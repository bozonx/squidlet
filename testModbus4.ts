import Context from 'system/Context';
import ModBusMasterRtu from './platforms/nodejs/ios/ModBusMasterRtu';
import {ModbusMaster} from './entities/drivers/ModbusMaster/ModbusMaster';
import EntityDefinition from './system/interfaces/EntityDefinition';
import PollOnceLogic, {FunctionHandler} from './portExpander/services/PortExpander/PollOnceLogic';
import {numToUint8Word} from './system/lib/binaryHelpers';
import {Results} from './portExpander/services/PortExpander/parseIncomeMessage';
import {AskDataCb} from './portExpander/services/PortExpander/readLogic';


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
  const askDataCb: AskDataCb = async (register: number, count: number): Promise<Uint8Array> => {
    const result: Uint16Array = await modbusMasterDriver
      .readInputRegisters(register, count);
    const parsedValues: number[] = [];

    // TODO: move to helpers
    for (let item of result) {
      const bytes: Uint8Array = numToUint8Word(item);

      parsedValues.push(bytes[0]);
      parsedValues.push(bytes[1]);
    }

    return new Uint8Array(parsedValues);
  };
  const pollOnceLogic = new PollOnceLogic(askDataCb);

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
  const handler: FunctionHandler = (functionNumber: number, args: Results) => {
    console.log(1111111, functionNumber, args);
  };

  pollOnceLogic.addEventListener(handler);
  await pollOnceLogic.pollOnce();


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
