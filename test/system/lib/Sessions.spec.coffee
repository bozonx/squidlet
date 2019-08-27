Sessions = require('../../../system/lib/Sessions').default;


describe 'system.lib.Sessions', ->
  beforeEach ->
    @generateUniqId = () => '123'
    @expireSec = 10
    @handler = sinon.spy()
    @sessions = new Sessions(@generateUniqId)

  it "long time connections (websocket)", ->
    sessionId = @sessions.newSession(@expireSec)
    @sessions.onSessionClosed(@handler)

    assert.equal(sessionId, '123')
    assert.isTrue(@sessions.isSessionActive(sessionId))

    clock = sinon.useFakeTimers()

    @sessions.waitForShutDown(sessionId)

    clock.tick(10000)

    sinon.assert.calledOnce(@handler)
    sinon.assert.calledWith(@handler, sessionId)
    assert.isFalse(@sessions.isSessionActive(sessionId))

    clock.restore()

  it "recover long time connections (websocket)", ->
    sessionId = @sessions.newSession(@expireSec)
    @sessions.onSessionClosed(@handler)

    clock = sinon.useFakeTimers()

    # connection lost
    @sessions.waitForShutDown(sessionId)

    clock.tick(7000)

    # connection established
    @sessions.recoverSession(sessionId)

    clock.restore()

    sinon.assert.notCalled(@handler)
    assert.isTrue(@sessions.isSessionActive(sessionId))
    @sessions.shutDownImmediately(sessionId)

  it "short connection (http)", ->
    clock = sinon.useFakeTimers()

    sessionId = @sessions.newSession(@expireSec, true)
    @sessions.onSessionClosed(@handler)

    assert.isTrue(@sessions.isSessionActive(sessionId))

    clock.tick(10000)

    sinon.assert.calledOnce(@handler)
    sinon.assert.calledWith(@handler, sessionId)
    assert.isFalse(@sessions.isSessionActive(sessionId))

    clock.restore()

  it "recover short connection (http)", ->
    clock = sinon.useFakeTimers()

    sessionId = @sessions.newSession(@expireSec, true)
    @sessions.onSessionClosed(@handler)

    clock.tick(7000)

    # renew timeout
    @sessions.waitForShutDown(sessionId)

    clock.tick(7000)

    sinon.assert.notCalled(@handler)
    assert.isTrue(@sessions.isSessionActive(sessionId))

    clock.tick(3000)
    clock.restore()

    assert.isFalse(@sessions.isSessionActive(sessionId))

  it "session data", ->
    sessionId = @sessions.newSession(@expireSec)

    @sessions.setStorage(sessionId, 'param1', 'value1')

    assert.equal(@sessions.getStorage(sessionId, 'param1'), 'value1')

    @sessions.shutDownImmediately(sessionId)

    assert.isUndefined(@sessions.getStorage(sessionId, 'param1'))

  it "removeSessionClosedListener", ->
    handlerIndex = @sessions.onSessionClosed(@handler)
    @sessions.removeSessionClosedListener(handlerIndex)

    assert.isUndefined(@sessions.closeEvents.handlers[handlerIndex])

  it "destroy", ->
    sessionId = @sessions.newSession(@expireSec)
    @sessions.onSessionClosed(@handler)
    @sessions.setStorage(sessionId, 'param1', 'value1')

    @sessions.destroy()

    assert.deepEqual(@sessions.closeEvents.handlers, [])
    assert.deepEqual(@sessions.closeConnectionTimeouts, {})
    assert.deepEqual(@sessions.sessionStorage, {})
    assert.deepEqual(@sessions.activeSession, {})
