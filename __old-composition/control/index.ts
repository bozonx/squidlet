import resolveCommand from '../../../../../../../mnt/disk2/workspace/squidlet/__old/control/resolveCommand.js';


resolveCommand()
  .catch((err) => {
    console.error(err);

    process.exit(2);
  });
