import LogLevel from '../../../../../../__old/system/interfaces/LogLevel';
import NodejsMachines from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old-composition/ios/nodejs/__old/interfaces/NodejsMachines';
import {NoMachine} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old-composition/ios/nodejs/__old/starters/StartBase';


export default interface StarterProps {
  //force?: boolean;
  logLevel?: LogLevel;
  machine?: NodejsMachines | NoMachine;
  hostName?: string;
  workDir?: string;
  user?: string | number;
  group?: string | number;
}
