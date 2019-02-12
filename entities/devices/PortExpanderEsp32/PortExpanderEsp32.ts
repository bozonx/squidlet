import DeviceBase, {DeviceBaseProps} from 'host/baseDevice/DeviceBase';
import {GetDriverDep} from 'host/entities/EntityBase';
import {
  ExpanderDriverProps,
  PortExpanderConnection,
  PortExpanderDriver
} from '../../drivers/PortExpander/PortExpander.driver';


interface Props extends DeviceBaseProps, ExpanderDriverProps {
  connection: PortExpanderConnection;
}


export default class PortExpanderEsp32 extends DeviceBase<Props> {
  get expander(): PortExpanderDriver {
    return this.depsInstances.expander as any;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.expander = await getDriverDep('PortExpander.driver')
      .getInstance(this.props);
  }

}
