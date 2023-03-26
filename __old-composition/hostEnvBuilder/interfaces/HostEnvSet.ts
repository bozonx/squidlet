import HostConfigSet from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/HostConfigSet.js';
import {HostEntitiesSet} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/HostEntitySet.js';


export default interface HostEnvSet {
  configs: HostConfigSet;
  entities: HostEntitiesSet;
}
