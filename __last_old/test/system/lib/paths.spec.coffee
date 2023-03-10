paths = require('../../../system/lib/paths');


describe 'system.lib.paths', ->
  it "pathJoin", ->
    assert.equal(paths.pathJoin('/path//', '/to/', './dir/'), '/path/to/./dir/')
    assert.equal(paths.pathJoin('/path//', '/', 'file'), '/path/file')
    assert.equal(
      paths.pathJoin('/envSet', 'configs', 'iosDefinitions.json'),
      '/envSet/configs/iosDefinitions.json'
    )

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
