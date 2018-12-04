import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverBase from '../../app/entities/DriverBase';
import Digital, {Edge, PinMode, WatchHandler} from '../../app/interfaces/dev/Digital';
import {ExpanderDriverProps, PCF8574Driver, ResultHandler} from '../Pcf8574/Pcf8574.driver';
import {DEFAULT_STATUS} from '../../baseDevice/Status';
import Response from '../../messenger/interfaces/Response';


type Wrapper = (values: boolean[]) => void;

interface DigitalPcf8574DriverProps extends ExpanderDriverProps {
  expander: string;
}


export class DigitalPcf8574Driver extends DriverBase<DigitalPcf8574DriverProps> implements Digital {
  // saved watchers by index
  private watchers: Wrapper[] = [];

  // private get expander(): PCF8574Driver {
  //   return this.depsInstances.expander as PCF8574Driver;
  // }

  // protected willInit = async (getDriverDep: GetDriverDep) => {
  //
  //   // this.depsInstances.expander = await getDriverDep('Pcf8574.driver')
  //   //   .getInstance(this.props);
  // }

  setup(pin: number, pinMode: PinMode, outputInitialValue?: boolean): Promise<void> {
    //await this.expander.setup(pin, pinMode, outputInitialValue);
    return this.callAction('setup', pin, pinMode, outputInitialValue);
  }

  getPinMode(pin: number): Promise<PinMode | undefined> {
    //return this.expander.getPinMode(pin);
    return this.callAction('getPinMode', pin);
  }

  read(pin: number): Promise<boolean> {
    //return this.expander.read(pin);
    return this.callAction('read', pin);
  }

  /**
   * Set level to output pin
   */
  write(pin: number, value: boolean): Promise<void> {
    //return this.expander.write(pin, value);
    return this.callAction('write', pin, value);
  }

  /**
   * Listen to interruption of input pin
   */
  async setWatch(pin: number, handler: WatchHandler, debounce?: number, edge?: Edge): Promise<number> {

    // TODO: что делать с debounce ?
    // TODO: что делать с edge ?

    const wrapper: Wrapper = (values: boolean[]) => {

      // TODO: нужно же обработать ошибку??? или она напишется в лог в Devices?

      // if (err) {
      //   this.env.log.error(String(err));
      //
      //   return;
      // }
      if (!values) {
        this.env.log.error(`DigitalPcf8574Driver.setWatch. pin: ${pin}. No values`);

        return;
      }

      handler(values[pin]);
    };

    //await this.expander.addListener(wrapper);
    await this.env.system.devices.listenStatus(this.props.expander, DEFAULT_STATUS, wrapper);

    const watcherIndex: number = this.watchers.length;
    this.watchers.push(wrapper);

    return watcherIndex;
  }

  async clearWatch(id: number): Promise<void> {
    // do nothing if watcher doesn't exist
    if (!this.watchers[id]) return;

    //await this.expander.removeListener(this.watchers[id]);
    await this.env.system.devices.removeListener(this.watchers[id]);
  }

  async clearAllWatches(): Promise<void> {
    for (let id in this.watchers) {
      //await this.expander.removeListener(this.watchers[id]);
      await this.env.system.devices.removeListener(this.watchers[id]);
    }
  }


  private async callAction(actionName: string, ...args: any[]): Promise<any> {
    const response: Response = await this.env.system.devices.callAction(this.props.expander, actionName, ...args);

    return response.payload;
  }

  // TODO: validate expander prop - it has to be existent device in master config

}


export default class Factory extends DriverFactoryBase<DigitalPcf8574Driver> {
  protected instanceAlwaysNew = true;
  protected DriverClass = DigitalPcf8574Driver;

  /**
   * It generates unique id for DigitalPin input and output driver
   */
  generateUniqId(props: {[index: string]: any}): string {
    const bus: string = (props.bus) ? String(props.bus) : 'default';

    return `${bus}-${props.address}`;
  }
}
