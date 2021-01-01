import DeviceBase from 'base/DeviceBase';

import {
  PortExpanderProps,
  PortExpanderConnection,
  PortExpander
} from '../PortExpander/PortExpander';


interface Props extends PortExpanderProps {
  connection: PortExpanderConnection;
}


export default class PortExpanderEsp32 extends DeviceBase<Props> {
  get expander(): PortExpander {
    return this.depsInstances.expander;
  }

  protected didInit = async () => {
    this.depsInstances.expander = await this.context.getSubDriver('PortExpander', this.props);
  }

}
