const _find = require('lodash/find');
const _omit = require('lodash/omit');

import Digital, {Edge, PinMode, WatchHandler} from '../../app/interfaces/dev/Digital';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import DigitalBaseProps from './interfaces/DigitalBaseProps';
import {invertIfNeed, resolveDriverName} from './digitalHelpers';


export type DigitalInputListenHandler = (level: boolean) => void;

export interface DigitalInputDriverProps extends DigitalBaseProps {
  // if no one of pullup and pulldown are set then both resistors will off
  // use pullup resistor
  pullup?: boolean;
  // use pulldown resistor
  pulldown?: boolean;
}


/**
 * This driver works with specified low level drivers like Digital_local, Digital_pcf8574 etc.
 */
export class DigitalInputDriver extends DriverBase<DigitalInputDriverProps> {
  // listener and its wrapper by listener id which gets from setWatch method of dev
  private listeners: {[index: string]: [DigitalInputListenHandler, WatchHandler]} = {};

  private get digital(): Digital {
    return this.depsInstances.digital as Digital;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    const driverName = resolveDriverName(this.props.driver && this.props.driver.name);

    this.depsInstances.digital = await getDriverDep(driverName)
      .getInstance(_omit(this.props.driver, 'name'));

    await this.digital.setup(this.props.pin, this.resolvePinMode());
  }


  /**
   * Get current binary value of pin.
   */
  async read(): Promise<boolean> {
    return invertIfNeed(await this.digital.read(this.props.pin), this.props.invert);
  }

  /**
   * Listen to interruption of pin.
   * @param handler
   * @param debounce - debounce time in ms only for input pins. If not set system defaults will be used.
   * @param edge - Listen to low, high or both levels. By default is both.
   */
  addListener(handler: DigitalInputListenHandler, debounce?: number, edge?: Edge): void {
    const wrapper: WatchHandler = (level: boolean) => {
      handler(invertIfNeed(level, this.props.invert));
    };

    const normalEdge: Edge = this.normalizeEdge(edge);
    const listenerId: number = this.setWatch(wrapper, normalEdge, debounce);

    this.listeners[listenerId] = [handler, wrapper];
  }

  listenOnce(handler: DigitalInputListenHandler, edge?: Edge): void {
    const wrapper: WatchHandler = (level: boolean) => {
      // remove listener and don't listen any more
      this.removeListener(handler);

      handler(invertIfNeed(level, this.props.invert));
    };

    const normalEdge: Edge = this.normalizeEdge(edge);
    const listenerId: number = this.setWatch(wrapper, normalEdge);

    this.listeners[listenerId] = [handler, wrapper];
  }

  removeListener(handler: DigitalInputListenHandler): void {
    _find(this.listeners, (handlerItem: [DigitalInputListenHandler, WatchHandler], listenerId: number) => {
      if (handlerItem[0] === handler) {
        delete this.listeners[listenerId];
        this.digital.clearWatch(Number(listenerId));

        return true;
      }

      return;
    });
  }


  // TODO: add destroy ???


  protected validateProps = (): string | undefined => {
    // TODO: validate params
    // TODO: validate specific for certain driver params
    return;
  }

  private resolvePinMode(): PinMode {
    if (this.props.pullup) return 'input_pullup';
    else if (this.props.pulldown) return 'input_pulldown';
    else return 'input';
  }

  private setWatch(wrapper: WatchHandler, edge: Edge, debounce?: number): number {
    const pinMode: PinMode | undefined = this.digital.getPinMode(this.props.pin);

    if (!pinMode || !pinMode.match(/input/)) {
      throw new Error(`Can't add listener. The GPIO pin "${this.props.pin}" wasn't set up as an input pin.`);
    }

    return this.digital.setWatch(
      this.props.pin,
      wrapper,
      debounce || this.env.system.host.config.config.drivers.defaultDigitalInputDebounce,
      edge
    );
  }

  /**
   * It is set invert param - then invert edge
   * @param edge
   */
  private normalizeEdge(edge?: Edge): Edge {

    // TODO: test

    if (!edge) {
      return 'both';
    }
    else if (this.props.invert && edge === 'rising') {
      return 'falling';
    }
    else if (this.props.invert && edge === 'falling') {
      return 'rising';
    }

    return edge;
  }

}


export default class Factory extends DriverFactoryBase<DigitalInputDriver> {
  protected DriverClass = DigitalInputDriver;
  protected calcInstanceId = (instanceProps: {[index: string]: any}): string => {
    const driverName: string = (instanceProps.driver && instanceProps.driver.name)
      ? instanceProps.driver.name
      : 'local';

    return `${driverName}-${instanceProps.pin}`;
  }
}
