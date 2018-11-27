HostClassNames = require('../../configWorks/HostClassNames').default
#hostDefaultConfig = require('../../configWorks/configs/hostDefaultConfig').default


describe.only 'configWorks.HostClassNames', ->
  beforeEach ->
    @driversClasses = ['Top.driver', 'Bottom.driver', 'Other.driver']
    @main = {
      masterConfig: {
        hostDefaults: {
          hostDefaultParam: 1
        }
        #getHostsIds: => ['master']
#        getPreHostConfig: =>
#          {
#            platform: 'rpi'
#            devices: {
#              room1: {
#                relay: {
#                  device: 'Relay'
#                  pin: 1
#                }
#              }
#            }
#            drivers: {
#              'Digital.driver': {
#                param: 1
#              }
#            }
#            services: {
#              backend: {
#                service: 'Backend'
#                param: 1
#              }
#            }
#            devicesDefaults: {
#              Relay: {
#                baseOne: true
#              }
#            }
#          }
      }
      entities: {
        getDevs: =>
        getDependencies: =>
          {
            drivers: {
              'Top.driver': ['Bottom.driver', 'Other.driver'],
              'Other.driver': ['Top.driver'],
            }
          }
      }
    }
    @hostClassNames = new HostClassNames(@main)

  it 'addDeps - check recursion', ->
    result = @hostClassNames.addDeps('drivers', @driversClasses)

    assert.deepEqual(result, @driversClasses)
