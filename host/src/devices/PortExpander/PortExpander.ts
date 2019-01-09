import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {ExpanderDriverProps, PortExpanderDriver} from '../../drivers/PortExpander/PortExpander.driver';


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

}
