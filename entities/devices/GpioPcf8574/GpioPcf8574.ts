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
    // initialize IC after app did init
    return this.expander.initIc();
  }

  destroy = async () => {
    // clear all the pins on destroy this instance (actually means destroy system).
    return this.expander.clearAll();
  }


  private gpio: GpioDigital = {
    digitalSetupInput: (
      pin: number,
      // on PCF8574 pins always have pullup resistors
      inputMode: InputResistorMode = InputResistorMode.pullup,
      debounce: number = 0,
      edge: Edge = Edge.both
    ): Promise<void> => {
      const resolvedDebounce: number = (typeof debounce === 'undefined')
        ? (this.props.defaultDebounce || 0)
        : debounce;

      return this.expander.setupInput(pin, resolvedDebounce, edge);
    },

    digitalSetupOutput: (pin: number, initialValue: boolean): Promise<void> => {
      return this.expander.setupOutput(pin, initialValue);
    },

    digitalGetPinDirection: (pin: number): Promise<PinDirection | undefined> => {
      return this.expander.getPinDirection(pin);
    },

    digitalGetPinResistorMode: async (pin: number): Promise<InputResistorMode | OutputResistorMode | undefined> => {
      return InputResistorMode.pullup;
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

    digitalRemoveListener: async (handlerIndex: number): Promise<void> => {
      return this.expander.removeListener(handlerIndex);
    },

  };

  protected actions = {
    // TODO: add actions like in GpioLocal
  };

}
