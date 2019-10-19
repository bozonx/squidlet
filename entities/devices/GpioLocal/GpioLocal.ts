import DeviceBase from 'system/base/DeviceBase';
import Gpio from 'system/interfaces/Gpio';
import DigitalIo, {
  ChangeHandler,
  Edge,
  InputResistorMode,
  OutputResistorMode
} from 'system/interfaces/io/DigitalIo';


interface GpioLocalProps {
  defaultDebounce: number;
}


export default class GpioLocal extends DeviceBase<GpioLocalProps> {
  private get digitalIo(): DigitalIo {
    return this.depsInstances.digitalIo as DigitalIo;
  }


  protected didInit = async () => {
    this.depsInstances.digitalIo = this.context.getIo('Digital');
  }

  destroy = async () => {
    await this.digitalIo.removeAllListeners();
  }


  private gpio: Gpio = {
    digitalSetupInput: (pin: number, inputMode: InputResistorMode, debounce: number, edge: Edge): Promise<void> => {
      // TODO: use default debounce
      return this.digitalIo.setupInput(pin, inputMode, debounce, edge);
    },

    digitalSetupOutput: (pin: number, initialValue: boolean, outputMode: OutputResistorMode): Promise<void> => {
      return this.digitalIo.setupOutput(pin, initialValue, outputMode);
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

    digitalGetPinMode: (pin: number): Promise<DigitalPinMode | undefined> => {
      return this.digitalIo.getPinMode(pin);
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
