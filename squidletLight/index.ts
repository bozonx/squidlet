import starter from './starter';
import {consoleError} from '../system/lib/helpers';


starter()
  .catch(consoleError);
