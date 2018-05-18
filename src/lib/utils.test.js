import {
  pipe,compose,assignPropsToArrays,pick,plog,omit,filter,spread,ensureArray,
  isObjectLike,flatten,replaceInCopy, replaceInEmpty,uniqueId,reject,identity,nthArg,
  has,hasIn,concat,concatRight,concatBefore,appendToCopy,concatAfter,keyIs,sort,get,constant,
  without,forkJoin,each,forOwn,pickBy,transform,omitBy,matches,transformToObj,mapv,mapk,tran,cycle,
  fltrv, fltrk,mapkToObjk, mapvToObjk, mapvToObjv, mapvToArr, mapkToArr,values,condNoExec as condx,
  is,ifElse,cond,isArray,stubTrue,isFunction,ensureFunction,stubNull,tranToArr,and,converge, omitv, assignAll,
  fltrMapvToArr,skip1If,abortIf,pipeAsync
} from './utils.js';
describe(`pipe`, () => {
  test(`passes all args to first fn`, () => {
    const args='abcd'.split('');
    const mockPiped = jest.fn(x=>x);
    pipe(mockPiped)(...args);
    expect(mockPiped.mock.calls[0]).toEqual(args);
  });
  test(`passes only first arg to subsequent functions`, () => {
    const args='abcd'.split('');
    const mockPiped = jest.fn(x=>x);
    pipe(identity,mockPiped)(...args);
    expect(mockPiped.mock.calls[0]).toEqual(['a']);
  });
  test(`calling abortIf skips all remaining pipe functions`, () => {
    expect(pipe(
      abortIf(is('a')),
      x=>'c',
      x=>'d',
    )('a'))
    .toBe('a');
    expect(pipe(
      x=>'c',
      abortIf(is('c')),
      x=>'d',
    )('a'))
    .toBe('c');
  });
});
describe(`pipeAsync`, () => {
  test(`passes all args to first fn`, () => {
    const str = 'abcdefghijklmnopqrstuvwxyz';
    return pipeAsync((...args)=>args.join(''))(...str.split('')).then((v)=>{
      return expect(v).toBe(str);
    });
  });
  test(`passes only first arg to subsequent functions`, () => {
    const str = 'abcdefghijklmnopqrstuvwxyz';
    return pipeAsync(x=>x,(...args)=>args.join('')) (...str.split('')).then((v)=>{
      return expect(v).toBe('a');
    });
    // expect(pipeAsync(x=>x,(...args)=>args.join(''))(...str.split(''))).toBe('a');
  });
  test(`calling abortIf skips all remaining pipe functions`, () => {
    // effectively turns mapping functions into any combination of filtering and reducing
    expect(pipeAsync(
      abortIf(is('a')),
      x=>'c',
      x=>'d',
    )('a')).resolves.toBe('a');
    expect(pipeAsync(
      x=>'c',
      abortIf(is('c')),
      x=>'d',
    )('a')).resolves.toBe('c');

    // need to decide error behavior
  });
  test(`successful abortIf returns the previous value`, () => {
    const err = new Error('I am error1');
    expect(pipeAsync(
      x=>{throw err;},
      abortIf(is(err)),
      x=>'d',
    )('a')).resolves.toBe(err);
    expect(pipeAsync(
      x=>'b',
      abortIf(is('b')),
      x=>'d',
    )('foo')).resolves.toBe('b');

    // need to decide error behavior
  });
  test('passes errors like successes so user can handle them with piped fn', () => {
    const mockCatch = jest.fn(x=>x);
    const mockPiped = jest.fn(x=>x);
    const err = new Error('I am an error');
    return pipeAsync(
      x=>{throw err},
      mockPiped
    )('a')
    .catch(mockCatch)
    .then(val=>{
      expect(val).toBe(err);
      expect(mockCatch).toHaveBeenCalledTimes(0);
      expect(mockPiped).toHaveBeenCalledTimes(1);
      expect(mockPiped.mock.calls[0][0]).toBe(err);
    })

  });
});
