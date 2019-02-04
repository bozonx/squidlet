HostClassNames = require('../../buildHostEnv/hostEnv/HostClassNames').default
#hostDefaultConfig = require('../../configWorks/configs/hostDefaultConfig').default


describe 'configWorks.HostClassNames', ->
  beforeEach ->
    @driversClasses = ['Top.driver', 'Middle.driver', 'Bottom.driver', 'Other.driver']
    @main = {
      configManager: {
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
              'Top.driver': ['Middle.driver'],
              'Middle.driver': ['Bottom.driver', 'Top.driver'],
              'Bottom.driver': ['Top.driver', 'Middle.driver'],
            }
          }
      }
    }
    @hostClassNames = new HostClassNames(@main)

  it 'addDeps - check recursion', ->
    result = @hostClassNames.addDeps('drivers', @driversClasses)

    assert.deepEqual(result, ['Middle.driver', 'Bottom.driver', 'Top.driver'])
