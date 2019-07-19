import Os from '../../shared/Os';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import Platforms from '../../hostEnvBuilder/interfaces/Platforms';
import IoSet from '../../system/interfaces/IoSet';


export type IoSetClass = new (os: Os, envBuilder: EnvBuilder, envSetDir: string, platform: Platforms, machine: string, paramsString?: string) => IoSet;
