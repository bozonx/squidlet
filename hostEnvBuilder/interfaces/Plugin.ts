import PluginEnv from '../entities/PluginEnv';


export default interface Plugin {
  (pluginEnv: PluginEnv): void;
}
