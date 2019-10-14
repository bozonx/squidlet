import DeviceBase from 'system/base/DeviceBase';
import {ChangeHandler, DigitalInputMode, DigitalPinMode, Edge} from 'system/interfaces/io/DigitalIo';
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

    // only for input pins
    // Listen to change events
    digitalOnChange: (pin: number, handler: ChangeHandler): Promise<number> => {
      return this.expander.onChange(pin, handler);
    },

    removeListener: (handlerIndex: number): Promise<void> => {
      return this.expander.removeListener(handlerIndex);
    },


    // /**
    //  * Listen to interruption of input pin
    //  */
    // setWatch: async(pin: number, handler: ChangeHandler): Promise<number> => {
    //   return this.callOnDevicesInit<number>(async () => {
    //     if (this.expanderDriver) {
    //       const wrapper = (targetPin: number, value: boolean) => {
    //         if (targetPin === pin) handler(value);
    //       };
    //
    //       const handlerId: number = await this.expanderDriver.addListener(wrapper);
    //
    //       this.handlerIds.push(handlerId);
    //
    //       return lastItem(this.handlerIds);
    //     }
    //
    //     throw new Error(this.expanderErrMsg('setWatch'));
    //   });
    // },

    // async clearWatch(id: number): Promise<void> {
    //   if (!this.expanderDriver) throw new Error(this.expanderErrMsg('clearWatch'));
    //
    //   // do nothing if watcher doesn't exist
    //   if (!this.handlerIds[id]) return;
    //
    //   await this.expanderDriver.removeListener(this.handlerIds[id]);
    // }
    //
    // async clearAllWatches(): Promise<void> {
    //   if (!this.expanderDriver) throw new Error(this.expanderErrMsg('clearAllWatches'));
    //
    //   for (let id in this.handlerIds) {
    //     await this.expanderDriver.removeListener(this.handlerIds[id]);
    //   }
    // }

    // TODO: validate expander prop - it has to be existent device in master config



  };

  protected actions = this.gpio as any;

  // private callOnDevicesInit<T>(cb: () => Promise<T>): Promise<T> {
  //   return new Promise<T>((resolve, reject) => {
  //     this.context.onDevicesInit(async () => {
  //       return cb()
  //         .then(resolve)
  //         .catch(reject);
  //     });
  //   });
  // }
  //
  // private expanderErrMsg(methodWhichCheck: string): string {
  //   return `DigitalPcf8574.${methodWhichCheck}: It seems that it calls before Pcf8574 is initialized`;
  // }



  // protected didInit = async () => {
  //   // listen driver's change
  //   this.expander.addListener(this.onExpanderChange);
  // }
  //
  // protected actions = {
  //   setup: (pin: number, pinMode: PinMode, outputInitialValue?: boolean): Promise<void> => {
  //     return this.expander.setup(pin, pinMode, outputInitialValue);
  //   },
  //
  //   getPinMode: (pin: number): Promise<'input' | 'output' | undefined> => {
  //     return this.expander.getPinMode(pin);
  //   },
  //
  //   read: (pin: number): Promise<boolean> => {
  //     return this.expander.read(pin);
  //   },
  //
  //   write: (pin: number, value: boolean): Promise<void> => {
  //     return this.expander.write(pin, value);
  //   },
  // };
  //
  // getStatus = async (): Promise<boolean[]> => {
  //   return await this.expander.getState();
  // }
  //
  // setStatus = async (newValue: boolean[]): Promise<void> => {
  //   return this.expander.writeOutputValues(newValue);
  // }
  //
  // protected transformPublishValue = (binArr: number[]): string => {
  //   return binArr.join('');
  // }
  //
  //
  // private onExpanderChange = async (err: Error | null, values?: boolean[]) => {
  //
  //   if (err) {
  //     return this.env.log.error(String(err));
  //   }
  //
  //   const params: PublishParams = {
  //     //isSilent: true,
  //   };
  //
  //   this.publish('status', values, params);
  // }

}
