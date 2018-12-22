/**
 * Main file which starts on microController's system boot.
 */

import System from './app/System';


const system = new System();

system.start()
  .catch((err: Error) => {
    console.log(`Uncaught error: ${String(err)}`);
  });
