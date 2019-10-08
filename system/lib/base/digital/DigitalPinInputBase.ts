// TODO: remove


import {Edge, WatchHandler, DigitalSubDriver, DigitalInputMode} from 'system/interfaces/io/DigitalIo';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import {omitObj} from 'system/lib/objects';
import IndexedEvents from 'system/lib/IndexedEvents';

import DigitalBaseProps from './interfaces/DigitalBaseProps';
import DigitalPinInputProps from './interfaces/DigitalPinInputProps';


/*
edge:
  type: '"rising" | "falling" | "both"'
  default: both
debounce:
  type: number
  default: 0
pullup:
  type: boolean
  default: false
pulldown:
  type: boolean
  default: false

### DigitalPin base props
pin:
  type: number
  required: true
source:
  type: string
  default: 'local'
 */



/**
 * This is middleware driver which allows acting with low level drivers as an input pin.
 * This driver works with specified low level drivers like Digital_local, Digital_pcf8574 etc.
 */
export default class DigitalPinInputBase<Props extends DigitalPinInputProps> extends DriverBase<Props> {
  private changeEvents = new IndexedEvents<WatchHandler>();
  private doubleCheckInProgress: boolean = false;
  private lastValue?: boolean;
  private secondCheckTimeout: number = 0;

  private get source(): DigitalSubDriver {
    return this.depsInstances.source;
  }


  init = async () => {
    // the second check is half of a debounce time
    //this.secondCheckTimeout = Math.ceil((this.props.debounce || 0) / 2);

    // if (!this.props.source) throw new Error(`DigitalPinInput: No source: ${JSON.stringify(this.props)}`);
    //
    // const driverName = makeDigitalSourceDriverName(this.props.source);
    //
    // this.depsInstances.source = await this.context.getSubDriver(
    //   driverName,
    //   omitObj(
    //     this.props,
    //     'doubleCheck',
    //     'pullup',
    //     'pulldown',
    //     'pin',
    //     'source'
    //   )
    // );

    // // setup pin as an input with resistor if specified
    // await this.source.setupInput(this.props.pin, this.resolvePinMode(), this.props.debounce, this.props.edge)
    //   .catch((err) => {
    //     this.log.error(
    //       `DigitalPinInputDriver: Can't setup pin. ` +
    //       `"${JSON.stringify(this.props)}": ${err.toString()}`
    //     );
    //   });
    //
    // await this.source.setWatch(this.props.pin, this.handleChange);
  }


  async getPinMode(): Promise<DigitalInputMode> {
    return this.resolvePinMode();
  }


  private handleChange = (state: boolean): void => {
    // // skip events if double check is waiting
    // if (this.doubleCheckInProgress) return;
    // // if doubleCheck isn't set up - just rise an event
    // else if (!this.props.doubleCheck) return this.changeEvents.emit(state);
    // if new state isn't changed - just emit event and do not do a check
    if (this.lastValue === state) return this.changeEvents.emit(state);

    //this.doSecondCheck(state);
  }

  // private resolvePinMode(): DigitalInputMode {
  //   if (this.props.pullup) return 'input_pullup';
  //   else if (this.props.pulldown) return 'input_pulldown';
  //   else return 'input';
  // }

  // /**
  //  * Get current binary value of pin.
  //  */
  // read(): Promise<boolean> {
  //   return this.source.read(this.props.pin);
  // }

  // /**
  //  * Listen to interruption of pin.
  //  */
  // async addListener(handler: WatchHandler): Promise<number> {
  //   //return this.source.setWatch(this.props.pin, handler);
  //   return this.changeEvents.addListener(handler);
  // }

  // async listenOnce(handler: WatchHandler): Promise<number> {
  //   return this.changeEvents.once(handler);
  // }

  // async removeListener(handlerIndex: number): Promise<void> {
  //   //return this.source.clearWatch(handlerIndex);
  //   this.changeEvents.removeListener(handlerIndex);
  // }

  // private doSecondCheck(newState: boolean) {
  //   this.doubleCheckInProgress = true;
  //
  //   setTimeout(async () => {
  //     this.doubleCheckInProgress = false;
  //
  //     // !newState && secondValue = true
  //     // newState && secondValue = true
  //     // !newState && !secondValue = false
  //     // newState && !secondValue = false
  //     const secondValue: boolean = await this.read();
  //
  //     //const result: boolean = this.resolveDoubleCheckValue(newState, secondValue);
  //
  //     this.lastValue = newState;
  //     this.changeEvents.emit(secondValue);
  //     //this.changeEvents.emit(result);
  //   }, this.secondCheckTimeout);
  // }

}
