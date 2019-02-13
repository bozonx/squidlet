import DeviceBase, {DeviceBaseProps} from 'host/baseDevice/DeviceBase';
import {GetDriverDep} from 'host/entities/EntityBase';

import {Pcf8574ExpanderProps, Pcf8574 as Pcf8574Driver} from '../../drivers/Pcf8574/Pcf8574';


interface Props extends DeviceBaseProps, Pcf8574ExpanderProps {
}


export default class Pcf8574 extends DeviceBase<Props> {
  get expander(): Pcf8574Driver {
    return this.depsInstances.expander as any;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.expander = await getDriverDep('Pcf8574')
      .getInstance(this.props);
  }

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
