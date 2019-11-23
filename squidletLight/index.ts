import starter from './squidletLightBuilder';
import {consoleError} from '../system/lib/helpers';


starter()
  .catch(consoleError);
