import {System} from '../../index.js'


(async () => {
  const system = new System()

  await system.init()
  await system.start()

  // TODO: make destroy on signals
})()
