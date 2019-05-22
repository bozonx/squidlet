Sessions = require('../../../system/helpers/Sessions').default;


describe.only 'system.helpers.Sessions', ->
  beforeEach ->
    @generateUniqId = () => '123'
    @expireSec = 10
    @sessions = new Sessions(@generateUniqId)

  it "long time connections (websocket)", ->
    sessionId = @sessions.newSession(@expireSec)

    assert.isTrue(@sessions.isSessionActive(sessionId))

    @sessions.waitForShutDown(sessionId)

  # TODO: продлить сессию

  it "short connection (http)", ->

  # TODO: проверить таймаут сессии
  # TODO: проверить storage - getStorage, setStorage
  # TODO: :::::
  it "recoverSession", ->
  it "waitForShutDown", ->
  it "onSessionClosed", ->
  it "removeSessionClosedListener", ->
  it "destroy", ->
