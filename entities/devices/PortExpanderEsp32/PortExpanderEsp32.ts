import DeviceBase from 'system/baseDevice/DeviceBase';
import {GetDriverDep} from 'system/entities/EntityBase';

import {
  PortExpanderProps,
  PortExpanderConnection,
  PortExpander
} from '../../drivers/PortExpander/PortExpander';


interface Props extends PortExpanderProps {
  connection: PortExpanderConnection;
}


export default class PortExpanderEsp32 extends DeviceBase<Props> {
  get expander(): PortExpander {
    return this.depsInstances.expander;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.expander = await getDriverDep('PortExpander')
      .getInstance(this.props);
  }

}
