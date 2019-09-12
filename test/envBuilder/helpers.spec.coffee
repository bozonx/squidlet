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

  it 'checkIoExistance', ->
    assert.doesNotThrow(() => helpers.checkIoExistance(['one'], ['one']))
    assert.throws(() => helpers.checkIoExistance(['one'], ['two']))

  it 'clearRelativePath', ->
    assert.equal(helpers.clearRelativePath('/abs'), '/abs')
    assert.equal(helpers.clearRelativePath('./rel'), 'rel')
    assert.equal(helpers.clearRelativePath('../rel'), 'rel')
    assert.equal(helpers.clearRelativePath('../rel/../to'), 'rel/to')

  it 'convertEntityTypePluralToSingle', ->
    assert.equal(helpers.convertEntityTypePluralToSingle('drivers'), 'driver');

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
