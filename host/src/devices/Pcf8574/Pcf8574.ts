import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {ExpanderDriverProps, PCF8574Driver} from '../../drivers/Pcf8574/Pcf8574.driver';


interface Props extends DeviceBaseProps, ExpanderDriverProps {
}


export default class Pcf8574 extends DeviceBase<Props> {
  get expander(): PCF8574Driver {
    return this.depsInstances.expander as PCF8574Driver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.expander = await getDriverDep('Pcf8574.driver')
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
  //   // TODO: проверить обработку ошибок что error придет
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
