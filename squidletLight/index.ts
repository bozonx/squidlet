import builder from './squidletLightBuilder';
import {consoleError} from '../system/lib/helpers';


builder()
  .catch(consoleError);
