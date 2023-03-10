import resolveCommand from './resolveCommand';


resolveCommand()
  .catch((err) => {
    console.error(err);

    process.exit(2);
  });
