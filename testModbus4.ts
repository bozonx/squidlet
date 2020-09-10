import ModBusMasterRtu from './platforms/nodejs/ios/ModBusMasterRtu';


async function start () {
  const master: ModBusMasterRtu = new ModBusMasterRtu();

  await master.configure({
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
  await master.init({
    log: {
      debug: console.log,
      info: console.log,
      warn: console.warn,
      error: console.error,
    }
  } as any);

  const slaveAddress = 0x01;
  const pinNumber: number = 12;
  const pinState: boolean = true;


  const result: Uint16Array = await master.readInputRegisters(0, slaveAddress, 0,4);

  console.log(22222222, result);

  // client.writeMultipleRegisters(0x00, pinSetupMessage)
  //   .then((data: any) => console.log('writing result ', data))
  //   .catch(handleErrors);
  //
  // setTimeout(() => {
  //   client.writeMultipleRegisters(0x00, pinWriteMessage)
  //     .then((data: any) => console.log('writing result ', data))
  //     .catch(handleErrors);
  // }, 100);

  // setTimeout(() => {
  //   //client.readHoldingRegisters(0, 1)
  //   client.readInputRegisters(0, 4)
  //     .then((data: any) => console.log('reading result ', data))
  //     .catch(handleErrors)
  //     .finally(() => socket.close());
  // }, 200);

}

start()
  .catch(console.error);
