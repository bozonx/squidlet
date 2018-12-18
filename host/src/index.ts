import System from './app/System';


const system = new System();

system.start()
  .catch((err: Error) => {

    // TODO: to starter's logger

    console.log(String(err));
  });
