import {GetDriverDep} from 'system/entities/EntityBase';
import ServiceBase from 'system/baseServices/ServiceBase';
import {WsServerSessions, WsServerSessionsProps} from '../../drivers/WsServerSessions/WsServerSessions';


export default class WsApi extends ServiceBase<WsServerSessionsProps> {
  private get wsServerSessions(): WsServerSessions {
    return this.depsInstances.wsServer;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.wsServer = await getDriverDep('WsServerSessions')
      .getInstance(this.props);
  }


}
