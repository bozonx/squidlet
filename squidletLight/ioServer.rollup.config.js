import path from 'path';

import rollupCommonConfig, {makeOutputDefinition} from './rollupCommonConfig';


// TODO: require it
//const envConfig = require(`./config/${process.env.ENV_CONF}`);
const envConfig = {
  buildDir: path.resolve(__dirname, '../build/ioServer'),
  sourceMaps: false,
  minimize: false,
};

const commonConfig = rollupCommonConfig(envConfig);


export default {
  ...commonConfig,
  input: path.resolve(__dirname, `./starters/ioServerIndex.ts`),
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
    ...commonConfig.external || [],
    'ws',
  ],
};
