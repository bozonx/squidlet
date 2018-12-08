var debug = global.__DEBUG;
var SystemClass = System.import('host/src/System');
var hostConfigSet = global.__HOST_CONFIG_SET;
var ConfigSetManager = global.__HOST_CONFIG_SET_MANAGER;

// make a system instance
var hostSystem = new SystemClass();

// integrate a config set
ConfigSetManager.hostConfigSet = hostConfigSet;

// register config set manager
hostSystem.$registerConfigSetManager(ConfigSetManager);

hostSystem.start()
  .catch((err) => {
    if (debug) {
      throw err;
    }
    else {
      console.error(err.toString());

      process.exit(3);
    }
  });
