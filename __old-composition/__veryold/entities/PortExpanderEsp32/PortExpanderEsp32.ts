import DeviceBase from 'base/DeviceBase';

import {
  PortExpanderProps,
  PortExpanderConnection,
  PortExpander
} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/entities/PortExpander/PortExpander.js';


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
