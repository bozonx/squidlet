import {parseArgs} from 'squidlet-lib/js'
import {SquidletCtl} from './SquidletCtl.js'


(async () => {
  const help = `
Squidlet control script.

commands:

- install <package.tar.gz> - Install or update the package which is in tar.gz format

Control system service
- status - show status of the service
- restart - restart the service. It will create service if need.
- start - start the service. It will create service if need.
- stop - stop the service
- enable - enable auto start service on system start
- disable - disable auto start service on system start

arguments:

- --host=localhost - set hostname of ip address to manipulate remote host. Default is localhost
- --port=41809 - main squidlet connect ws port. Default is 41809
`

  const {params, args} = parseArgs(process.argv.slice(2))

  if (params.help) {
    console.info(help)

    return
  }

  const ctrl = new SquidletCtl(params)
  const cmd = args[0]

  switch (cmd) {
    case 'install':
      await ctrl.installPackage(args[1])
      break
    case 'status':
      await ctrl.status()
      break
    case 'restart':
      await ctrl.restart()
      break
    case 'start':
      await ctrl.start()
      break
    case 'stop':
      await ctrl.stop()
      break
    case 'enable':
      await ctrl.enable()
      break
    case 'disable':
      await ctrl.disable()
      break
    default:
      console.info(`ERROR: Wrong command "${cmd}"\n\n-----------------------\n`)
      console.info(help)
      break
  }
})()
