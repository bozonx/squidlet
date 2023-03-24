export interface ServiceProps {
  // list of required drivers
  readonly requireDriver?: string[]
  // list of required services. It means:
  // * if required service is not installed then this service will not be used
  // * if required service has just started then this service will be started
  // * if required service has just gone to failed state then this service will be stopped
  // * if required service has just stopped then this service will be stopped
  // * if required service has just destroyed then this service will be destroyed
  readonly required: string[]
  // timeout for starting process. It it exceeded then it goes to failed state
  readonly startTimeoutSec?: number
  // timeout for stopping process. It it exceeded then it goes to failed state
  readonly stopTimeoutSec?: number
  // wait some time before start and start in restarting process
  readonly waitBeforeStartSec?: number
  // Tries count of restart service if it gone to failed state.
  // * 0 means unlimited
  // * -1 means do not restart
  // * >1 count of restarts
  readonly restartTries: number
}
