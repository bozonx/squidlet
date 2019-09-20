paths = require('../../../system/lib/paths');


describe.only 'system.lib.paths', ->
  it "pathJoin", ->
    assert.equal(paths.pathJoin('/path//', '/to/', './dir/'), '/path/to/./dir/')

  it "pathIsAbsolute", ->
    assert.isTrue(paths.pathIsAbsolute('/path'))
    assert.isTrue(paths.pathIsAbsolute('~/path'))
    assert.isFalse(paths.pathIsAbsolute('./path'))
    assert.isFalse(paths.pathIsAbsolute('path'))
    assert.isFalse(paths.pathIsAbsolute('../path'))

  it "pathDirname", ->
    assert.equal(paths.pathDirname('/path/to/dir/'), '/path/to')

  it "pathBasename", ->
    assert.equal(paths.pathBasename('/path/to/dir'), 'dir')
