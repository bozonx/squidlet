import path from 'path';

import rollupCommonConfig, {makeOutputDefinition} from './rollupCommonConfig';


const envConfig = require(`./config/${process.env.ENV_CONF}`);
const commonConfig = rollupCommonConfig(envConfig);


export default {
  ...commonConfig,
  input: path.resolve(__dirname, `index.ts`),
  output: [
    {
      ...makeOutputDefinition(envConfig, {}),
      name: 'Squidlet',
    },
  ],
  // watch: {
  //   include: path.resolve(__dirname, 'src/**'),
  // },
  external: [
    ...commonConfig.external,
  ],
};
