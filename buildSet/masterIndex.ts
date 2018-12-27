/**
 * master:
 * * receives master config
 * * generate all the host files
 * * generate master config set include parsed config, paths to entities and configs and platform config
 * * passes it to platform index file and runs host system as is, without building
 */

import * as yargs from 'yargs';

import masterStarter from './masterStarter';


const debug: boolean = Boolean(yargs.argv.debug);


masterStarter()
  .catch((err) => {
    // if (debug) {
    //   throw err;
    // }
    // else {
    //   console.error(err.toString());
    //
    //   process.exit(3);
    // }

    console.error(String(err));

    process.exit(3);
  });
