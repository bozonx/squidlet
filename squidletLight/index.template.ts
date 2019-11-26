import IoSetBuiltin from '${REPO_ROOT}/squidletLight/IoSetBuiltin';
import LightStarter from '${REPO_ROOT}/squidletLight/LightStarter';
import IoSet from '${REPO_ROOT}/system/interfaces/IoSet';
import envSet from './envSet';
import * as ios from './ios';
import * as devicesMainFiles from './devicesMainFiles';
import * as driversMainFiles from './driversMainFiles';
import * as servicesMainFiles from './servicesMainFiles';


const ioSet: IoSet = new IoSetBuiltin(envSet, ios, devicesMainFiles, driversMainFiles, servicesMainFiles);


export default function instantiateStarter (): LightStarter {
  return new LightStarter(ioSet);
}
