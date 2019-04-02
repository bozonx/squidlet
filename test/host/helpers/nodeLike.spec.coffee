nodeLike = require('../../../host/helpers/nodeLike');


describe.only 'helpers.nodeLike', ->
  it "pathJoin", ->
    assert.equal(nodeLike.pathJoin('/path/', '/to/', './dir'), '/path/to/./dir')

  it "pathIsAbsolute", ->
    assert.isTrue(nodeLike.pathIsAbsolute('/path'))
    assert.isTrue(nodeLike.pathIsAbsolute('~/path'))
    assert.isFalse(nodeLike.pathIsAbsolute('./path'))
    assert.isFalse(nodeLike.pathIsAbsolute('path'))
    assert.isFalse(nodeLike.pathIsAbsolute('../path'))
