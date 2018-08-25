import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

const argv = require('yargs').argv;


export default function resolveMasterConfig() {
  if (!argv.config) {
    throw new Error(`You have to specify a "--config" param`);
  }

  const resolvedPath = path.resolve(argv.config);
  const yamlString = fs.readFileSync(resolvedPath, 'utf8');

  return yaml.safeLoad(yamlString);
}
