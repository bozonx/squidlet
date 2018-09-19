import DriverEnv from '../../app/entities/DriverEnv';
import MyAddress from '../../app/interfaces/MyAddress';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import { I2cDataDriver, I2cDriverClass, DataHandler } from '../../drivers/I2c/I2cData.driver';
import { uint8ArrayToText, textToUint8Array } from '../../helpers/helpers';
import HandlersManager from '../../helpers/HandlersManager';
import {EntityProps} from '../../app/interfaces/EntityDefinition';


type ConnectionHandler = (error: Error | null, payload?: any) => void;


/**
 * Instance for each type of connection and bus and address of current host.
 * It works as master or slave according to address
 * It packs data to send it via i2c.
 */
export class I2cConnectionDriver {
  private readonly env: DriverEnv;
  private readonly props: EntityProps;
  private readonly myAddress: MyAddress;
  private readonly i2cDataDriver: I2cDataDriver;
  // dataAddress of this driver's data
  private readonly dataMark: number = 0x01;
  private handlersManager: HandlersManager<ConnectionHandler, DataHandler> = new HandlersManager<ConnectionHandler, DataHandler>();

  constructor(props: EntityProps, env: DriverEnv, myAddress: MyAddress) {
    this.env = env;
    this.props = props;
    this.myAddress = myAddress;

    const isMaster = typeof this.myAddress.address === 'undefined';
    const dataDriver = this.env.getDriver('I2cData.driver');
    const i2cDriverName = (isMaster) ? 'I2cMaster.driver' : 'I2cSlave.driver';
    // get low level i2c driver
    //const i2cDriver: I2cDriverClass = this.env.getDriver<I2cDriverClass>(i2cDriverName);

    this.i2cDataDriver = dataDriver.getInstance({ i2cDriverName, bus: this.myAddress.bus }) as I2cDataDriver;
  }

  async send(remoteAddress: string, payload: any): Promise<void> {
    const jsonString = JSON.stringify(payload);
    const uint8Arr = textToUint8Array(jsonString);

    await this.i2cDataDriver.send(remoteAddress, this.dataMark, uint8Arr);
  }

  listenIncome(remoteAddress: string, handler: ConnectionHandler): void {
    const wrapper = (error: Error | null, payload?: Uint8Array): void => {
      if (error)  return handler(error);
      if (!payload) return handler(new Error(`Payload is undefined`));

      const jsonString = uint8ArrayToText(payload);
      const data = JSON.parse(jsonString);

      handler(null, data);
    };

    this.handlersManager.addHandler(remoteAddress, handler, wrapper);
    this.i2cDataDriver.listenIncome(remoteAddress, this.dataMark, wrapper);
  }

  removeListener(remoteAddress: string, handler: ConnectionHandler): void {
    const wrapper: DataHandler = this.handlersManager.getWrapper(remoteAddress, handler) as DataHandler;

    // unlisten
    this.i2cDataDriver.removeListener(remoteAddress, this.dataMark, wrapper);
    this.handlersManager.removeByHandler(remoteAddress, handler);
  }

}


export default class Factory extends DriverFactoryBase {
  protected DriverClass: { new (
      props: EntityProps,
      env: DriverEnv,
      myAddress: MyAddress,
    ): I2cConnectionDriver } = I2cConnectionDriver;
}
