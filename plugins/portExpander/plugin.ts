import * as path from 'path';
import PluginEnv from '../../hostEnvBuilder/entities/PluginEnv';


export default async function systemEntitiesPlugin (env: PluginEnv) {
  await env.addService(path.resolve(__dirname, './services/IoSetPortExpander/manifest.yaml'));
}
