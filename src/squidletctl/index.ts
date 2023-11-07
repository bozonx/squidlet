import {DEFAULT_WS_CTRL_PORT} from '../types/contstants.js'


console.log(process.argv)

// TODO: install <package.tar.gz> - установить пакет

const help = `
Squidlet control script.

commands:

- install <package.tar.gz> - Install or update the package which is in tar.gz format
- update - update the squidlet host itself
- start - start the service. It will create service if need.
- stop - stop the service
- install-service - Install the squidlet service
- uninstall-service - remove service from system. It removes only services and nothing else

arguments:

- --host="localhost" - set hostname of ip address to manipulate remote host. Default is localhost
- --port=41809 - main squidlet connect ws port. Default is 41809

`


//DEFAULT_WS_CONNECT_PORT
