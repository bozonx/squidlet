import PluginEnv from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/entities/PluginEnv.js';


export default interface Plugin {
  (pluginEnv: PluginEnv): void;
}
