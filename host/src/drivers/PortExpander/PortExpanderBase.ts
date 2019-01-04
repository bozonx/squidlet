
// Constant for undefined pin direction (unused pin).
import DriverBase from '../../app/entities/DriverBase';
import {Handler, I2cNodeDriverBaseProps} from '../I2c/I2cNode.driver';
import {PinMode} from '../../app/interfaces/dev/Digital';
import {byteToBinArr, updateBitInByte} from '../../helpers/helpers';
import Connection from './Connection';

export interface ExpanderDriverProps extends I2cNodeDriverBaseProps {
  pinCount: number;
}

// TODO: наверное не нужно обрабатывать ошибку
export type ResultHandler = (err: Error | null, values?: boolean[]) => void;


export const DIR_UNDEF = -1;
// Constant for input pin direction.
export const DIR_IN = 1;
// Constant for output pin direction.
export const DIR_OUT = 0;


export default class PortExpanderBase extends DriverBase<ExpanderDriverProps> {
  private readonly connection: Connection = new Connection();
  // /** Direction of each pin. By default all pin directions are undefined. */
  // private directions:Array<number> = [
  //   DIR_UNDEF, DIR_UNDEF, DIR_UNDEF, DIR_UNDEF,
  //   DIR_UNDEF, DIR_UNDEF, DIR_UNDEF, DIR_UNDEF
  // ];
  /** Bitmask for all input pins. Used to set all input pins to high on the PCF8574/PCF8574A IC. */
  private inputPinBitmask: number = 0;
  /** Bitmask representing the current state of the pins. */
  private currentState: number = 0;
  private wasIcInited: boolean = false;

  // TODO: init connection


  async setup(pin: number, pinMode: PinMode, outputInitialValue?: boolean): Promise<void> {
    if (pin < 0 || pin > (this.props.pinCount - 1)) {
      throw new Error('Pin out of range');
    }

    // if (this.directions[pin] !== DIR_UNDEF) {
    //   this.env.log.warn(`PCF8574Driver.setup(${pin}, ${pinMode}, ${outputInitialValue}). This pin has been already set up`);
    //
    //   return;
    // }

    if (pinMode === 'output') {
      // output pin
      if (typeof outputInitialValue === 'undefined') {
        throw new Error(`You have to specify an outputInitialValue`);
      }

      this.inputPinBitmask = this.updatePinInBitMask(this.inputPinBitmask, pin, false);
      //this.directions[pin] = DIR_OUT;
      // update local state
      this.currentState = this.updatePinInBitMask(this.currentState, pin, outputInitialValue);
    }
    else {
      // input pin
      if (pinMode !== 'input') {
        this.env.log.warn(`Pcf8574 expander doesn't support setting of pullup or pulldown resistors`);
      }

      // set input pin to high
      this.inputPinBitmask = this.updatePinInBitMask(this.inputPinBitmask, pin, true);
      //this.directions[pin] = DIR_IN;
    }
  }

  /**
   * Add listener to change of any pin.
   */
  addListener(handler: ResultHandler): number {
    const wrapper: Handler = () => {
      this.setLastReceivedState();
      handler(null, this.getValues());
    };

    return this.connection.addListener(wrapper);
  }

  removeListener(handlerIndex: number) {
    this.connection.removeListener(handlerIndex);
  }

  /**
   * Poll expander and return values of all the pins
   */
  async poll(): Promise<boolean[]> {
    if (!this.env.system.isInitialized) {
      this.env.log.warn(`PCF8574Driver.poll(). It runs before app is initialized`);
    }

    console.log('------- poll');

    // init IC if it isn't inited at this moment
    if (!this.wasIcInited) await this.initIc();

    await this.connection.poll();
    this.setLastReceivedState();

    return this.getValues();
  }

  async getPinMode(pin: number): Promise<'input' | 'output' | undefined> {

    // TODO: make requrest

    // if (this.directions[pin] === DIR_IN) {
    //   return 'input';
    // }
    // else if (this.directions[pin] === DIR_OUT) {
    //   return 'output';
    // }

    // undefined means didn't specify
    return;
  }

  /**
   * Returns array like [true, true, false, false, true, true, false, false]
   */
  getValues(): boolean[] {
    return byteToBinArr(this.currentState);
  }

  /**
   * Returns the current value of a pin.
   * This returns the last saved value, not the value currently returned by the PCF8574/PCF9574A IC.
   * To get the current value call doPoll() first, if you're not using interrupts.
   * @param  {number} pin The pin number. (0 to 7)
   * @return {boolean}               The current value.
   */
  async read(pin: number): Promise<boolean> {
    if (pin < 0 || pin > 7) {
      return false;
    }

    return ((this.currentState>>pin) % 2 !== 0);
  }

  /**
   * Set the value of an output pin.
   * @param  {number}  pin   The pin number. (0 to 7)
   * @param  {boolean} value The new value for this pin.
   * @return {Promise}
   */
  async write(pin: number, value :boolean): Promise<void> {
    if (pin < 0 || pin > 7) {
      throw new Error('Pin out of range');
    }
    // else if (this.directions[pin] !== DIR_OUT) {
    //   throw new Error('Pin is not defined as output');
    // }

    // update local state
    this.currentState = this.updatePinInBitMask(this.currentState, pin, value);
    // write to IC
    await this.writeToIc();
  }

  /**
   * Set new state of output pins.
   * Not output pins (input, undefined) are ignored.
   */
  async writeState(values: boolean[]): Promise<void> {
    let newState: number = this.currentState;

    for (let pin = 0; pin < 8; pin++) {
      if (this.directions[pin] !== DIR_OUT) {
        // isn't an output pin
        continue;
      }

      newState = this.updatePinInBitMask(newState, pin, values[pin]);
    }

    this.currentState = newState;

    return this.writeToIc();
  }


  private setLastReceivedState() {
    const lastData: Uint8Array | undefined = this.connection.getLastData();

    if (!lastData) return;

    // TODO: брать только значения input пинов!!!!! см writeState
    // TODO: нужно ли инвертировать???

    console.log(11111111, 'current - ', this.currentState.toString(2), ' | new - ', lastData[0].toString(2));
    // TODO: use it
    //this.currentState = lastData[0];


    // TODO: review old code

    // // check each input for changes
    // for(let pin = 0; pin < 8; pin++){
    //   if(this.directions[pin] !== DIR_IN){
    //     continue; // isn't an input pin
    //   }
    //   if((this.currentState>>pin) % 2 !== (readState>>pin) % 2){
    //     // pin changed
    //     let value: boolean = ((readState>>pin) % 2 !== 0);
    //     this.currentState = this.updatePinInBitMask(this.currentState, <number>pin, value);
    //     if(noEmit !== pin){
    //       this.events.emit(INPUT_EVENT_NAME, <InputData>{pin: pin, value: value});
    //     }
    //   }
    // }
  }

  /**
   * Write the current state to the IC.
   * @return {Promise} gets resolved when the state is written to the IC, or rejected in case of an error.
   */
  private async writeToIc () {
    // it means that IC is inited when first data is written
    this.wasIcInited = true;

    // set all input pins to high
    const newIcState = this.currentState | this.inputPinBitmask;
    const dataToSend: Uint8Array = new Uint8Array(1);

    // send one byte to IC
    dataToSend[0] = newIcState;

    await this.connection.write(undefined, dataToSend);
  }



  /**
   * Helper function to set/clear one bit in a bitmask.
   * @param  {number}            current The current bitmask.
   * @param  {number}            pin     The bit-number in the bitmask.
   * @param  {boolean}           value   The new value for the bit. (true=set, false=clear)
   * @return {number}                    The new (modified) bitmask.
   */
  private updatePinInBitMask(current: number, pin: number, value: boolean): number{
    return updateBitInByte(current, pin, value);
  }

  /**
   * Do first write to IC if it doesn't do before.
   */
  private async initIc() {
    try {
      await this.writeToIc();
    }
    catch (err) {
      this.env.log.error(`PortExpander.driver. Can't init IC state, props are "${JSON.stringify(this.props)}". ${String(err)}`);
    }
  }

}
