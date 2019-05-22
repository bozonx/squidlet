Sessions = require('../../../system/helpers/Sessions').default;


describe.only 'system.helpers.Sessions', ->
  beforeEach ->
    @generateUniqId = () => '123'
    @expireSec = 10
    @sessions = new Sessions(@generateUniqId)

  it "long time connections (websocket)", ->
    closeHandler = sinon.spy()
    sessionId = @sessions.newSession(@expireSec)
    @sessions.onSessionClosed(closeHandler)

    assert.equal(sessionId, '123')
    assert.isTrue(@sessions.isSessionActive(sessionId))

    clock = sinon.useFakeTimers()

    @sessions.waitForShutDown(sessionId)

    clock.tick(10000)

    sinon.assert.calledOnce(closeHandler)
    sinon.assert.calledWith(closeHandler, sessionId)
    assert.isFalse(@sessions.isSessionActive(sessionId))

    clock.restore()

  it "recover long time connections (websocket)", ->
    closeHandler = sinon.spy()
    sessionId = @sessions.newSession(@expireSec)
    @sessions.onSessionClosed(closeHandler)

    clock = sinon.useFakeTimers()

    @sessions.waitForShutDown(sessionId)

    clock.tick(7000)

    @sessions.recoverSession(sessionId)

    clock.tick(7000)

    sinon.assert.notCalled(closeHandler)
    assert.isTrue(@sessions.isSessionActive(sessionId))

    clock.tick(3000)
    clock.restore()

  it "short connection (http)", ->
    closeHandler = sinon.spy()

    clock = sinon.useFakeTimers()

    sessionId = @sessions.newSession(@expireSec, true)
    @sessions.onSessionClosed(closeHandler)

    assert.isTrue(@sessions.isSessionActive(sessionId))

    clock.tick(10000)

    sinon.assert.calledOnce(closeHandler)
    sinon.assert.calledWith(closeHandler, sessionId)
    assert.isFalse(@sessions.isSessionActive(sessionId))

    clock.restore()

  it "recover short connection (http)", ->
    clock = sinon.useFakeTimers()

    closeHandler = sinon.spy()
    sessionId = @sessions.newSession(@expireSec, true)
    @sessions.onSessionClosed(closeHandler)

    clock.tick(7000)

    @sessions.waitForShutDown(sessionId)

    clock.tick(7000)

    sinon.assert.notCalled(closeHandler)
    assert.isTrue(@sessions.isSessionActive(sessionId))

    clock.tick(3000)
    clock.restore()

  it "session data", ->
    sessionId = @sessions.newSession(@expireSec)

    @sessions.setStorage(sessionId, 'param1', 'value1')

    assert.equal(@sessions.getStorage(sessionId, 'param1'), 'value1')

    @sessions.shutDownImmediately(sessionId)

    assert.isUndefined(@sessions.getStorage(sessionId, 'param1'))

  it "removeSessionClosedListener", ->
    closeHandler = sinon.spy()
    handlerIndex = @sessions.onSessionClosed(closeHandler)
    @sessions.removeSessionClosedListener(handlerIndex)

    assert.isUndefined(@sessions.closeEvents.handlers[handlerIndex])

  it "destroy", ->
    sessionId = @sessions.newSession(@expireSec)
    @sessions.onSessionClosed(sinon.spy())
    @sessions.setStorage(sessionId, 'param1', 'value1')

    @sessions.destroy()

    assert.deepEqual(@sessions.closeEvents.handlers, [])
    assert.deepEqual(@sessions.closeConnectionTimeouts, {})
    assert.deepEqual(@sessions.sessionStorage, {})
    assert.deepEqual(@sessions.activeSession, {})
