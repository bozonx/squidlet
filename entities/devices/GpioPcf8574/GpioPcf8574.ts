import DeviceBase from 'system/base/DeviceBase';
import {ChangeHandler, DigitalInputMode, DigitalOutputMode, DigitalPinMode, Edge} from 'system/interfaces/io/DigitalIo';
import {GpioDigital} from 'system/interfaces/Gpio';

import {Pcf8574ExpanderProps, Pcf8574 as Pcf8574Driver} from '../../drivers/Pcf8574/Pcf8574';


interface Props extends Pcf8574ExpanderProps {
}


export default class GpioPcf8574 extends DeviceBase<Props> {
  get expander(): Pcf8574Driver {
    return this.depsInstances.expander;
  }

  protected didInit = async () => {
    this.depsInstances.expander = await this.context.getSubDriver('Pcf8574', this.props);
  }

  // TODO: сделать запись в IC нужно когда проинициализируются все пины


  private gpio: GpioDigital = {

    // TODO: после дестроя всех digital драйверов надо поидее сделать removeAllListeners()

    digitalSetupInput: (pin: number, inputMode: DigitalInputMode, debounce: number, edge: Edge): Promise<void> => {
      // TODO: use default debounce
      return this.expander.setupInput(pin, debounce, edge);
    },

    digitalSetupOutput: (pin: number, initialValue: boolean): Promise<void> => {
      return this.expander.setupOutput(pin, initialValue);
    },

    digitalGetPinMode: (pin: number): Promise<DigitalPinMode | undefined> => {
      return this.expander.getPinMode(pin);
    },

    digitalRead: (pin: number): Promise<boolean> => {
      return this.expander.read(pin);
    },

    /**
     * Set level to output pin
     */
    digitalWrite: (pin: number, value: boolean): Promise<void> => {
      return this.expander.write(pin, value);
    },

    digitalSetupAndRead(pin: number, inputMode?: DigitalInputMode): Promise<boolean> {
      // TODO: add
    },

    digitalSetupAndWrite(pin: number, value: boolean, outputMode?: DigitalOutputMode): Promise<void> {
      // TODO: add
    },

    // only for input pins
    // Listen to change events
    digitalOnChange: async (pin: number, handler: ChangeHandler): Promise<number> => {
      return this.expander.onChange(pin, handler);
    },

    removeListener: async (handlerIndex: number): Promise<void> => {
      return this.expander.removeListener(handlerIndex);
    },

    // TODO: validate expander prop - it has to be existent device in master config

  };

  protected actions = this.gpio as any;
}
