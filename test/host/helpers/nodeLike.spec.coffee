nodeLike = require('../../../host/helpers/nodeLike');


describe 'helpers.nodeLike', ->
  it "pathJoin", ->
    assert.equal(nodeLike.pathJoin('/path/', '/to/', './dir'), '/path/to/./dir')

  it "pathIsAbsolute", ->
    assert.isTrue(nodeLike.pathIsAbsolute('/path'))
    assert.isTrue(nodeLike.pathIsAbsolute('~/path'))
    assert.isFalse(nodeLike.pathIsAbsolute('./path'))
    assert.isFalse(nodeLike.pathIsAbsolute('path'))
    assert.isFalse(nodeLike.pathIsAbsolute('../path'))

  it "pathDirname", ->
    assert.equal(nodeLike.pathDirname('/path/to/dir/'), '/path/to')

  it "pathBasename", ->
    assert.equal(nodeLike.pathBasename('/path/to/dir'), 'dir')
