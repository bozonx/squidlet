import DeviceBase from 'system/base/DeviceBase';
import Gpio from 'system/interfaces/Gpio';
import DigitalIo, {ChangeHandler, Edge, InputResistorMode, OutputResistorMode} from 'system/interfaces/io/DigitalIo';
import {PinDirection} from 'system/interfaces/io/DigitalIo';


interface GpioLocalProps {
  defaultDebounce?: number;
}


/**
 * GPIO device which is represent a local digital, analog and PWM IO ports.
 * Don't specify more than one instance please in config.
 * Default instance in config should be names as "gpio".
 * Props of this instance will be defaults of IO devices.
 */
export default class GpioLocal extends DeviceBase<GpioLocalProps> {
  private get digitalIo(): DigitalIo {
    return this.context.getIo('Digital');
  }


  destroy = async () => {
    // clear all the pins on destroy this instance (actually means destroy system).
    await this.digitalIo.clearAll();
  }


  private gpio: Gpio = {
    digitalSetupInput: (
      pin: number,
      inputMode: InputResistorMode,
      debounce: number = 0,
      edge: Edge = Edge.both
    ): Promise<void> => {
      const resolvedDebounce: number = (typeof debounce === 'undefined')
        ? (this.props.defaultDebounce || 0)
        : debounce;

      return this.digitalIo.setupInput(pin, inputMode, resolvedDebounce, edge);
    },

    digitalSetupOutput: (pin: number, initialValue: boolean, outputMode: OutputResistorMode): Promise<void> => {
      return this.digitalIo.setupOutput(pin, initialValue, outputMode);
    },

    digitalGetPinDirection: (pin: number): Promise<PinDirection | undefined> => {
      return this.digitalIo.getPinDirection(pin);
    },

    digitalGetPinResistorMode: (pin: number): Promise<InputResistorMode | OutputResistorMode | undefined> => {
      return this.digitalIo.getPinResistorMode(pin);
    },

    digitalRead: (pin: number): Promise<boolean> => {
      return this.digitalIo.read(pin);
    },

    // only for output pins
    digitalWrite: (pin: number, level: boolean): Promise<void> => {
      return this.digitalIo.write(pin, level);
    },

    digitalSetupAndRead(pin: number, inputMode?: InputResistorMode): Promise<boolean> {
      // TODO: add
    },

    digitalSetupAndWrite(pin: number, value: boolean, outputMode?: OutputResistorMode): Promise<void> {
      // TODO: add
    },

    // only for input pins
    // Listen to change events
    digitalOnChange: (pin: number, handler: ChangeHandler): Promise<number> => {
      // TODO: не будет работать если пин не сконфигурирован
      return this.digitalIo.onChange(pin, handler);
    },

    removeListener: (handlerIndex: number): Promise<void> => {
      return this.digitalIo.removeListener(handlerIndex);
    },
  };

  protected actions = this.gpio as any;
}
