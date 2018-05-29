import * as i2cBusModule from 'i2c-bus';


/**
 * It's raspberry pi implementation of I2C bus.
 */
export default class {
  private readonly bus: i2cBusModule.I2cBus;

  constructor(bus: string) {
    if (!bus) throw new Error(`You have to specify I2C bus`);

    this.bus = i2cBusModule.openSync(Number(bus));
  }

  /**
   * Read data without specifying a command
   */
  read(
    addrHex: number,
    length: number,
    buffer: Buffer,
    cb: (err: Error, bytesRead: number, resultBuffer: Buffer) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const callback = (err, bytesRead, resultBuffer) => {
        if (err) {
          return reject(err);
        }

        if (length !== bytesRead) {
          return reject(new Error(
            `Read wrong number of bytes. Requested ${length}, read ${bytesRead}`
          ));
        }

        resolve(resultBuffer);
      };

      this.bus.i2cRead(addrHex, length, buffer, callback);
    });
  }

  /**
   * Write data without specifying a command
   */
  write() {
    // bus.i2cWrite(addr, length, buffer, cb)
  }

  /**
   * Read one byte with specifying a command
   */
  readByte() {
    // bus.readByte(addr, cmd, cb)
  }

  /**
   * Write one byte with specifying a command
   */
  writeByte() {
    // bus.writeByte(addr, cmd, byte, cb)
  }

  /**
   * Read two bytes with specifying a command
   */
  readWord() {
    //bus.readWord(addr, cmd, cb)
  }

  /**
   * Write two bytes with specifying a command
   */
  writeWord() {
    // bus.writeWord(addr, cmd, word, cb)
  }

  /**
   * Write only a command
   */
  writeQuick() {
    // bus.writeQuick(addr, bit, cb)
  }

  /**
   * Read block of data till 32 bytes and specify a command
   */
  readBlock() {
    // bus.readI2cBlock(addr, cmd, length, buffer, cb)
  }

  /**
   * Write block of data till 32 bytes and specify a command
   */
  writeBlock() {
    // bus.writeI2cBlock(addr, cmd, length, buffer, cb)
  }

}
