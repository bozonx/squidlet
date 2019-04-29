import ServiceBase from 'system/baseServices/ServiceBase';
import {GetDriverDep} from '../../../system/entities/EntityBase';


interface Props {
}


export default class BackDoor extends ServiceBase<Props> {
  private get wsServerDriver(): WebSocketServer {
    return this.depsInstances.wsServerDriver as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.wsServerDriver = await getDriverDep('WebSocketServer')
      .getInstance(this.props);
  }

}
