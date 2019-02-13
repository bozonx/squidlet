import DeviceBase, {DeviceBaseProps} from 'host/baseDevice/DeviceBase';
import {GetDriverDep} from 'host/entities/EntityBase';

import {
  ExpanderDriverProps,
  PortExpanderConnection,
  PortExpander
} from '../../drivers/PortExpander/PortExpander';


interface Props extends DeviceBaseProps, ExpanderDriverProps {
  connection: PortExpanderConnection;
}


export default class PortExpanderEsp32 extends DeviceBase<Props> {
  get expander(): PortExpander {
    return this.depsInstances.expander as any;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.expander = await getDriverDep('PortExpander')
      .getInstance(this.props);
  }

}
