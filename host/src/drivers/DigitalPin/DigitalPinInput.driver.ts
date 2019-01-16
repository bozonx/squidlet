import Digital, {Edge, DigitalPinMode, WatchHandler} from '../../app/interfaces/dev/Digital';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DigitalBaseProps from './interfaces/DigitalBaseProps';
import {resolveDriverName} from './digitalHelpers';
import {find, omit} from '../../helpers/lodashLike';


export interface DigitalPinInputDriverProps extends DigitalBaseProps {
  // if no one of pullup and pulldown are set then both resistors will off
  // use pullup resistor
  pullup?: boolean;
  // use pulldown resistor
  pulldown?: boolean;
}

const NO_DEBOUNCE_VALUE = 0;


/**
 * This driver works with specified low level drivers like Digital_local, Digital_pcf8574 etc.
 */
export class DigitalPinInputDriver extends DriverBase<DigitalPinInputDriverProps> {
  // listener and its wrapper by listener id which gets from setWatch method of dev
  private listeners: {[index: string]: WatchHandler} = {};

  private get source(): Digital {
    return this.depsInstances.source as Digital;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    const driverName = resolveDriverName(this.props.source);

    this.depsInstances.source = await getDriverDep(driverName)
      .getInstance(omit(this.props, 'pullup', 'pulldown', 'pin', 'source'));
  }

  protected didInit = async () => {
    // setup pin as an input with resistor if specified
    await this.source.setup(this.props.pin, this.resolvePinMode());
  }


  /**
   * Get current binary value of pin.
   */
  read(): Promise<boolean> {
    return this.source.read(this.props.pin);
  }

  /**
   * Listen to interruption of pin.
   * @param handler
   * @param debounce - debounce time in ms only for input pins. If not set system defaults will be used.
   * @param edge - Listen to low, high or both levels. By default is both.
   */
  async addListener(handler: WatchHandler, debounce?: number, edge?: Edge): Promise<void> {
    const listenerId: number = await this.setWatch(handler, edge, debounce);
    // save listener id
    this.listeners[listenerId] = handler;
  }

  async listenOnce(handler: WatchHandler, debounce?: number, edge?: Edge): Promise<void> {
    const wrapper: WatchHandler = async (level: boolean) => {
      // remove listener and don't listen any more
      await this.removeListener(handler);

      handler(level);
    };

    const listenerId: number = await this.setWatch(wrapper, edge, debounce);
    // save listener id and its original handler
    this.listeners[listenerId] = handler;
  }

  removeListener(handler: WatchHandler): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      find(this.listeners, (handlerItem: WatchHandler, listenerId: string) => {
        if (handlerItem === handler) {
          delete this.listeners[listenerId];
          this.source.clearWatch(Number(listenerId))
            .then(resolve)
            .catch(reject);

          return true;
        }

        return;
      });
    });
  }


  // TODO: add destroy ???


  protected validateProps = (): string | undefined => {
    // TODO: validate params
    // TODO: validate specific for certain driver params
    // TODO: только pullup или pulldown может быть установлен
    return;
  }

  private resolvePinMode(): DigitalPinMode {
    if (this.props.pullup) return 'input_pullup';
    else if (this.props.pulldown) return 'input_pulldown';
    else return 'input';
  }

  private async setWatch(wrapper: WatchHandler, edge?: Edge, debounce: number = NO_DEBOUNCE_VALUE): Promise<number> {
    const pinMode: DigitalPinMode | undefined = await this.source.getPinMode(this.props.pin);
    const normalEdge: Edge = edge || 'both';

    if (!pinMode || !pinMode.match(/input/)) {
      throw new Error(`Can't add listener. The GPIO pin "${this.props.pin}" wasn't set up as an input pin.`);
    }

    return this.source.setWatch(
      this.props.pin,
      wrapper,
      debounce,
      normalEdge
    );
  }

}


export default class Factory extends DriverFactoryBase<DigitalPinInputDriver> {
  protected instanceAlwaysNew = true;
  protected DriverClass = DigitalPinInputDriver;

  // TODO: спросить bus и address у нижележащего драйвера - выполнить generateUniqId()

  // protected calcInstanceId = (props: {[index: string]: any}): string => {
  //
  //   // TODO: не правильно!!!! может быть наложение если брать экспандеры
  //
  //   const driverName: string = (props.driver && props.driver.name)
  //     ? props.driver.name
  //     : 'local';
  //
  //   return `${driverName}-${props.pin}`;
  // }
}
