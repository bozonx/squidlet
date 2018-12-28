import PluginEnv from '../PluginEnv';


export default interface Plugin {
  (pluginEnv: PluginEnv): void;
}
