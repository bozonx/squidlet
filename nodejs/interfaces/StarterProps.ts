import LogLevel from '../../system/interfaces/LogLevel';
import NodejsMachines from './NodejsMachines';
import {NoMachine} from '../starters/Props';


export default interface StarterProps {
  force?: boolean;
  logLevel?: LogLevel;
  machine?: NodejsMachines | NoMachine;
  hostName?: string;
  workDir?: string;
  user?: string | number;
  group?: string | number;
}
