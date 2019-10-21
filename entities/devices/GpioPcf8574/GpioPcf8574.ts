import DeviceBase from 'system/base/DeviceBase';
import {ChangeHandler} from 'system/interfaces/io/DigitalIo';
import {GpioDigital} from 'system/interfaces/Gpio';
import {Edge} from 'system/interfaces/gpioTypes';
import {InputResistorMode, OutputResistorMode, PinDirection} from 'system/interfaces/gpioTypes';
import {omitObj} from 'system/lib/objects';

import {Pcf8574ExpanderProps, Pcf8574 as Pcf8574Driver} from '../../drivers/Pcf8574/Pcf8574';


interface Props extends Pcf8574ExpanderProps {
  // default debounce for all ge input pins
  defaultDebounce?: number;
}


/**
 * GPIO device which is represent a PCF8574 port expander board.
 * Don't specify more than one instance in config please.
 * Props of this instance will be defaults of IO devices.
 */
export default class GpioPcf8574 extends DeviceBase<Props> {
  get expander(): Pcf8574Driver {
    return this.depsInstances.expander;
  }

  protected didInit = async () => {
    this.depsInstances.expander = await this.context.getSubDriver('Pcf8574', {
      ...omitObj(this.props, 'defaultDebounce'),
    });
    // TODO: нужно ли явно включать буферизацию запросов ???
  }

  protected appDidInit = () => {
    return this.depsInstances.initIc();
  }

  destroy = () => {
    // clear all the pins on destroy this instance (actually means destroy system).
    return this.expander.clearAll();
  }


  private gpio: GpioDigital = {
    digitalSetupInput(pin: number, inputMode: InputResistorMode, debounce?: number, edge?: Edge): Promise<void> {
      // TODO: use default debounce
      return this.expander.setupInput(pin, debounce, edge);
    },

    digitalSetupOutput(pin: number, initialValue: boolean, outputMode: OutputResistorMode): Promise<void> {
      return this.expander.setupOutput(pin, initialValue);
    },

    digitalGetPinDirection: (pin: number): Promise<PinDirection | undefined> => {
      //return this.expander.getPinMode(pin);
      // TODO: add
    },

    digitalGetPinResistorMode: (pin: number): Promise<InputResistorMode | OutputResistorMode | undefined> => {
      // TODO: add
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

    digitalOnChange: async (pin: number, handler: ChangeHandler): Promise<number> => {
      return this.expander.onChange(pin, handler);
    },

    removeListener: async (handlerIndex: number): Promise<void> => {
      return this.expander.removeListener(handlerIndex);
    },

  };

  protected actions = {
    // TODO: add actions like in GpioLocal
  };

}
