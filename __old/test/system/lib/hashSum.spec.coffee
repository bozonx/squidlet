hashSum = require('../../../system/lib/hashSum').default


describe 'system.lib.hashSum', ->
  it 'sum', ->
    str = 'asdfgh123456qwerylgjfn fidf eiefijef efi 34539987 kjgndfkj dfgojfgl'
    assert.equal(hashSum(str), hashSum(str))
    assert.isFalse(hashSum(str) == hashSum(str + ' '))
    assert.isFalse(hashSum(str) == hashSum('other str'))
    assert.equal(hashSum(str).length, 8)
