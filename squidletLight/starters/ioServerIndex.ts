import {IoServerStandalone} from './IoServerStandalone';
import {consoleError} from '../../system/lib/helpers';


const ioServerStandalone: IoServerStandalone = new IoServerStandalone();

ioServerStandalone.start()
  .catch(consoleError);
