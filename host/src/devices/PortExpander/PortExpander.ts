import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {
  ExpanderDriverProps,
  PortExpanderDriver,
  PortExpanderPinMode,
  State
} from '../../drivers/PortExpander/PortExpander.driver';
import {PinMode} from '../../app/interfaces/dev/Digital';


interface Props extends DeviceBaseProps, ExpanderDriverProps {
}


export default class PortExpander extends DeviceBase<Props> {
  get expander(): PortExpanderDriver {
    return this.depsInstances.expander as PortExpanderDriver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.expander = await getDriverDep('PortExpander.driver')
      .getInstance(this.props);
  }

  //
  // protected actions = {
  //   setup: (pin: number, pinMode: PinMode, outputInitialValue?: boolean): Promise<void> => {
  //     return this.expander.setup(pin, pinMode, outputInitialValue);
  //   },
  //
  //   getPinMode: (pin: number): Promise<PortExpanderPinMode | undefined> => {
  //     return this.expander.getPinMode(pin);
  //   },
  //
  //   readDigital: (pin: number): Promise<boolean> => {
  //     return this.expander.readDigital(pin);
  //   },
  //
  //   writeDigital: (pin: number, value: boolean): Promise<void> => {
  //     return this.expander.writeDigital(pin, value);
  //   },
  // };

}
