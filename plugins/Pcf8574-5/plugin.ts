import * as path from 'path';
import PluginEnv from '../../hostEnvBuilder/entities/PluginEnv';


export default async function systemEntitiesPlugin (env: PluginEnv) {
  await env.addDriver(path.resolve(__dirname, './drivers/Pcf8574/manifest.yaml'));
  await env.addService(path.resolve(__dirname, './services/IoSetPcf8574/manifest.yaml'));
}
