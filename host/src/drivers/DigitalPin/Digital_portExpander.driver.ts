import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverBase from '../../app/entities/DriverBase';
import Digital, {Edge, PinMode, WatchHandler} from '../../app/interfaces/dev/Digital';
import {ExpanderDriverProps} from '../Pcf8574/Pcf8574.driver';
import {DEFAULT_STATUS} from '../../baseDevice/Status';
import Response from '../../messenger/interfaces/Response';
import {LENGTH_AND_START_ARR_DIFFERENCE} from '../../app/dict/constants';
import DebounceCall from '../../helpers/DebounceCall';


type Wrapper = (values: boolean[]) => void;

interface DigitalPortExpanderDriverProps extends ExpanderDriverProps {
  expander: string;
}


export class DigitalPortExpanderDriver extends DriverBase<DigitalPortExpanderDriverProps> implements Digital {
  // saved handlerId. Keys are handlerIndexes
  // it needs to do clearAllWatches()
  private handlerIds: string[] = [];
  private readonly debounceCall: DebounceCall = new DebounceCall();


  setup(pin: number, pinMode: PinMode, outputInitialValue?: boolean): Promise<void> {
    return this.callAction('setup', pin, pinMode, outputInitialValue);
  }

  getPinMode(pin: number): Promise<PinMode | undefined> {
    return this.callAction('getPinMode', pin);
  }

  read(pin: number): Promise<boolean> {
    return this.callAction('read', pin);
  }

  /**
   * Set level to output pin
   */
  write(pin: number, value: boolean): Promise<void> {
    return this.callAction('write', pin, value);
  }

  /**
   * Listen to interruption of input pin
   */
  async setWatch(pin: number, handler: WatchHandler, debounce?: number, edge?: Edge): Promise<number> {
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

      const pinValue: boolean = values[pin];

      // skip not suitable edge
      if (edge === 'rising' && !pinValue) {
        return;
      }
      else if (edge === 'falling' && pinValue) {
        return;
      }

      if (!debounce) {
        handler(pinValue);
      }
      else {
        // wait for debounce and read current level
        this.debounceCall.invoke( pin, debounce, async () => {
          const realLevel = await this.read(pin);
          handler(realLevel);
        });
      }
    };

    const handlerId: string = await this.env.system.devices.listenStatus(this.props.expander, DEFAULT_STATUS, wrapper);

    this.handlerIds.push(handlerId);

    return this.handlerIds.length - LENGTH_AND_START_ARR_DIFFERENCE;
  }

  async clearWatch(id: number): Promise<void> {
    // do nothing if watcher doesn't exist
    if (!this.handlerIds[id]) return;

    await this.env.system.devices.removeListener(this.handlerIds[id]);
  }

  async clearAllWatches(): Promise<void> {
    for (let id in this.handlerIds) {
      await this.env.system.devices.removeListener(this.handlerIds[id]);
    }
  }


  private async callAction(actionName: string, ...args: any[]): Promise<any> {
    const response: Response = await this.env.system.devices.callAction(this.props.expander, actionName, ...args);

    return response.payload;
  }

  // TODO: validate expander prop - it has to be existent device in master config

}


export default class Factory extends DriverFactoryBase<DigitalPortExpanderDriver> {
  protected instanceAlwaysNew = true;
  protected DriverClass = DigitalPortExpanderDriver;

  /**
   * It generates unique id for DigitalPin input and output driver
   */
  generateUniqId(props: {[index: string]: any}): string {
    const bus: string = (props.bus) ? String(props.bus) : 'default';

    return `${bus}-${props.address}`;
  }
}
