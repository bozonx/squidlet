import LogLevel from '../../../../../../squidlet/__old/system/interfaces/LogLevel';
import NodejsMachines from '../../../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/networking/io/nodejs/__old/interfaces/NodejsMachines.js';
import {NoMachine} from '../../../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/networking/io/nodejs/__old/starters/StartBase.js';


export default interface StarterProps {
  //force?: boolean;
  logLevel?: LogLevel;
  machine?: NodejsMachines | NoMachine;
  hostName?: string;
  workDir?: string;
  user?: string | number;
  group?: string | number;
}
