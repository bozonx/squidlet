import * as i2cBusModule from 'i2c-bus';


/**
 * It's raspberry pi implementation of I2C bus.
 */
export default class I2c {
  private readonly bus: i2cBusModule.I2cBus;

  constructor(bus: string) {
    if (!bus) throw new Error(`You have to specify I2C bus`);

    this.bus = i2cBusModule.openSync(Number(bus));
  }

  // TODO: выдавать сконфигурированные инстансы

  readFrom(addrHex: number, quantity: number): Promise<Uint8Array> {
    const bufferToRead = new Buffer(quantity);

    return new Promise((resolve, reject) => {
      const callback = (err: Error, bytesRead: number, resultBuffer: Buffer) => {
        if (err) return reject(err);

        if (length !== bytesRead) {
          return reject(new Error(
            `Wrong number of bytes was read. Requested ${length}, read ${bytesRead}`
          ));
        }

        // TODO: convert to Uint8Array

        resolve();
      };

      this.bus.i2cRead(addrHex, quantity, bufferToRead, callback);
    });
  }

  writeTo(address: number, data: Array<number> | string): Promise<void> {
    // TODO: может использвать Uint8Array
  }




/////////////////////////////////////////////////////////////

  // /**
  //  * Read data without specifying a command.
  //  * Data will be in buffer after reading.
  //  */
  // read(addrHex: number, length: number, buffer: Buffer = undefined): Promise<Buffer> {
  //   const bufferToRead = buffer || new Buffer(length);
  //
  //   return new Promise((resolve, reject) => {
  //     const callback = (err: Error, bytesRead: number, resultBuffer: Buffer) => {
  //       if (err) return reject(err);
  //
  //       if (length !== bytesRead) {
  //         return reject(new Error(
  //           `Wrong number of bytes was read. Requested ${length}, read ${bytesRead}`
  //         ));
  //       }
  //
  //       resolve(resultBuffer);
  //     };
  //
  //     this.bus.i2cRead(addrHex, length, bufferToRead, callback);
  //   });
  // }
  //
  // /**
  //  * Write data without specifying a command.
  //  */
  // write(addrHex: number, length: number, buffer: Buffer): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     const callback = (err: Error, bytesWritten: number, resultBuffer: Buffer) => {
  //       if (err) return reject(err);
  //
  //       if (length !== bytesWritten) {
  //         return reject(new Error(
  //           `Wrong number of bytes was written. Requested ${length}, read ${bytesWritten}`
  //         ));
  //       }
  //
  //       resolve();
  //     };
  //
  //     this.bus.i2cWrite(addrHex, length, buffer, callback);
  //   });
  // }
  //
  // /**
  //  * Read one byte with specifying a command
  //  */
  // readByte(addrHex: number, cmd: number): Promise<number> {
  //   return new Promise((resolve, reject) => {
  //     const callback = (err: Error, byte: number) => {
  //       if (err) return reject(err);
  //
  //       resolve(byte);
  //     };
  //
  //     this.bus.readByte(addrHex, cmd, callback);
  //   });
  // }
  //
  // /**
  //  * Write one byte with specifying a command
  //  */
  // writeByte(addrHex: number, cmd: number, byte: number): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     const callback = (err: Error) => {
  //       if (err) return reject(err);
  //
  //       resolve();
  //     };
  //
  //     this.bus.writeByte(addrHex, cmd, byte, callback);
  //   });
  // }
  //
  // /**
  //  * Read work (two bytes) with specifying a command
  //  */
  // readWord(addrHex: number, cmd: number): Promise<number> {
  //   return new Promise((resolve, reject) => {
  //     const callback = (err: Error, word: number) => {
  //       if (err) return reject(err);
  //
  //       resolve(word);
  //     };
  //
  //     this.bus.readWord(addrHex, cmd, callback);
  //   });
  // }
  //
  // /**
  //  * Write two bytes with specifying a command
  //  */
  // writeWord(addrHex: number, cmd: number, word: number): Promise<void> {
  //   // bus.writeWord(addr, cmd, word, cb)
  //   return new Promise((resolve, reject) => {
  //     const callback = (err: Error) => {
  //       if (err) return reject(err);
  //
  //       resolve();
  //     };
  //
  //     this.bus.writeWord(addrHex, cmd, word, callback);
  //   });
  // }
  //
  // /**
  //  * Read block of data up to 32 bytes and specify a command
  //  */
  // readBlock(addrHex: number, cmd: number, length: number, buffer: Buffer = undefined): Promise<Buffer> {
  //   const bufferToRead = buffer || new Buffer(length);
  //
  //   return new Promise((resolve, reject) => {
  //     const callback = (err: Error, bytesRead: number, resultBuffer: Buffer) => {
  //       if (err) return reject(err);
  //
  //       if (length !== bytesRead) {
  //         return reject(new Error(
  //           `Wrong number of bytes was read. Requested ${length}, read ${bytesRead}`
  //         ));
  //       }
  //
  //       resolve(resultBuffer);
  //     };
  //
  //     this.bus.readI2cBlock(addrHex, cmd, length, bufferToRead, callback);
  //   });
  // }
  //
  // /**
  //  * Write block of data till 32 bytes and specify a command
  //  */
  // writeBlock() {
  //   // bus.writeI2cBlock(addr, cmd, length, buffer, cb)
  //
  //   // TODO: add
  //
  // }

}


// /**
//  * SMBus quick command. Writes a single bit to the device.
//  * @param {number} addrHex
//  * @param {number} cmd
//  * @param {number} bit - bit to write (0 or 1)
//  */
// writeQuick(addrHex: number, cmd: number, bit: number): Promise<void> {
//   return new Promise((resolve, reject) => {
//     const callback = (err: Error) => {
//       if (err) return reject(err);
//
//       resolve();
//     };
//
//     this.bus.writeQuick(addrHex, cmd, bit, callback);
//   });
// }
