helpers = require('../../hostEnvBuilder/helpers')

describe 'envBuilder.helpers', ->
  it 'sortByIncludeInList', ->
    assert.deepEqual(
      helpers.sortByIncludeInList(['three', 'one', 'four', 'two'], ['one', 'two']),
      [
        ['one', 'two'],
        ['three', 'four'],
      ]
    )

  it 'checkDevsExistance', ->
    assert.doesNotThrow(() => helpers.checkDevsExistance(['one'], ['one']))
    assert.throws(() => helpers.checkDevsExistance(['one'], ['two']))

  it 'clearRelativePath', ->
    assert.equal(helpers.clearRelativePath('/abs'), '/abs')
    assert.equal(helpers.clearRelativePath('./rel'), 'rel')
    assert.equal(helpers.clearRelativePath('../rel'), 'rel')
    assert.equal(helpers.clearRelativePath('../rel/../to'), 'rel/to')

 # it 'yamlToJs', ->
#    testYaml = '''
#      emptyObj: {}
#      arr: []
#      empty: !!js/undefined
#
#
#      obj:
#        param: 1
#        emptyParam:
#
#      objWillBeEmpty:
#        param:
#          emptyParam:
#
#      emptyStr: ''
#      null: null
#      undefined: undefined
#      string: 'str'
#      num: 0
#      emptyEnd: ~
#    ''';
#
#    testYaml = '''
#      emptyObj: {}
#      arr: []
#      emptyStr: ''
#      null: null
#      undefined: undefined
#      string: 'str'
#      num: 0
#      empty: ~
#    ''';
#
#    assert.deepEqual(helpers.yamlToJs(testYaml), {
#      emptyObj: {}
#      arr: []
#      emptyStr: ''
#      null: null
#      undefined: 'undefined'
#      string: 'str'
#      num: 0
#      # !!! empty node is null !
#      empty: null
#    });
