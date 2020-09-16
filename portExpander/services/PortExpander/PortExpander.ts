import ServiceBase from 'system/base/ServiceBase';
import IoItem from '../../../system/interfaces/IoItem';
import VirtualIoSet from '../../../system/interfaces/VirtualIoSet';


interface Props {
}


export default class PortExpander extends ServiceBase<Props> implements VirtualIoSet {

  init = async () => {
    //this.depsInstances.wsServer = await this.context.getSubDriver('WsServerSessions', this.props);
  }

  destroy = async () => {
  }


  getIo<T extends IoItem>(ioName: string): T {

  }

  getNames(): string[] {

  }

}
