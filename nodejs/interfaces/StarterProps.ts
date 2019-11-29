import LogLevel from '../../system/interfaces/LogLevel';
import NodejsMachines from './NodejsMachines';
import {NoMachine} from '../starters/Props';


export default interface StarterProps {
  configPath: string;
  argForce?: boolean;
  argLogLevel?: LogLevel;
  argMachine?: NodejsMachines | NoMachine;
  argHostName?: string;
  argWorkDir?: string;
  argUser?: string;
  argGroup?: string;
}
