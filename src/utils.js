/* eslint-disable no-unused-vars */
import {
  pick, map as mapFP, transform as transformFP,flatten,mapValues as mapValuesFP,forOwn as forOwnFP,mapKeys,
  reduce as reduceFP,capitalize,once,isError as isJSError,spread,rest,omit,filter as filterFP,uniqueId,
  find as findFP,findIndex,findKey,iteratee,matches as matchesFP,reject,concat,constant,overEvery,overSome,
  negate,flatMap,flattenDeep,over, identity, get,each as eachFP,pickBy,difference,
  isInteger,isError,isNumber,isObjectLike,hasIn,has,isWeakMap, isWeakSet, isMap, isSet,isEmpty,
  isString, isPlainObject, isFunction, isNull,isUndefined,set,unset,curry,mergeAllWith as mergeAllWithFP,mergeAll as mergeAllFP,
  omitBy,rearg,rangeStep,assignAll as assignAllFP,assignAllWith as assignAllWithFP,ary as arity,
  unary,sortBy,keyBy,kebabCase,size,partition
} from 'lodash/fp';
import {merge,mergeWith,set as _set,debounce as _debounce,memoize as _memoize} from 'lodash';
import $$observable from 'symbol-observable';


export const [forOwn,transform,find,filter,map,each,mapValues,reduce] = [
  forOwnFP,transformFP,findFP,filterFP,mapFP,eachFP,mapValuesFP,reduceFP].map(fn=>fn.convert({cap:false}));

export {
  identity,get,pick,flatten,mapKeys,capitalize,once,isJSError,spread,rest,keyBy,
  findKey,uniqueId,findIndex,set,mergeWith,reject,concat,constant,flatMap,flattenDeep,omit,
  isInteger,isError,isNumber,isObjectLike,hasIn,has,isWeakMap, isWeakSet, isMap, isSet,isEmpty,
  isString, isPlainObject, isFunction, isNull,isUndefined,_set,unset,pickBy,curry,omitBy,sortBy,
  rearg,rangeStep,over,kebabCase,size,partition
}


// predicates
export const isFalsy = arg=>!arg;
export const isTruthy = arg=>!!arg;
export const is = val1=>val2=>val1===val2;
export const isUndefOrNull = val => val == undefined; // eslint-disable-line
export const isPromise = x=>!isUndefOrNull(x) && isFunction(x.then);
export const {isArray} = Array;
export const len0 = ({length})=>length===0;
export const len1 = ({length})=>length===1;
export const first = get(0);
export const keyIs = rearg([1])(is);
export const isKeyMatch = predicate=>(v,k)=>predicate(k);
export const isValMatch = predicate=>(v,k)=>predicate(v);
export const isProductionEnv = ()=>process.env.NODE_ENV === 'production';
export const matches = arity(1)(matchesFP);
export const isObservable = (x=Object.create(null))=>isFunction(x[$$observable]);
// stubs
export const stubNull = ()=>null;
export const stubArray = ()=>[];
export const stubObject = ()=>({});
export const stubString = ()=>'';
export const stubTrue = ()=>true;
export const stubFalse = ()=>false;



// strings
export const split = splitter=>str=>str.split(splitter);
// functions
export const invokeArgsOnObj = (...args) => mapValues(fn=>fn(...args));
export const invokeObjectWithArgs = (obj)=>(...args) => mapValues(fn=>isFunction(fn) ? fn(...args) : fn)(obj);
export const partialBlankObj = fn => (...vals) => fn({},...vals);
export const mergeToBlank = partialBlankObj(Object.assign);
export const noop = ()=>{};
export const overObj = obj=>(...args)=>mapv(f=>f(...args))(obj);
export const converge = (arg)=>(isArray(arg)?over:overObj)(arg);
export const mergeAllWith = curry((fn,arr)=>mergeAllWithFP(fn,arr),2);
export const assignAllWith = curry((fn,arr)=>assignAllWithFP(fn,arr),2);
export const mergeAll = arr=>mergeAllFP(arr);
export const assignAll = arr=>assignAllFP(arr);
// console.log(`_memoize`, _memoize);
export const memoize = curry(rearg([1,0],_memoize),2);
export const debounce = curry((wait,opts,fn)=>_debounce(fn,wait,opts),3);

// logic
export const ifElse = (predicate,ifTrue,ifFalse=identity)=>(...args)=>((predicate(...args) ? ifTrue : ifFalse)(...args));
export const elseIf = (ifTrue,ifFalse)=>predicate=>ifElse(predicate,ifTrue,ifFalse);
export const condNoExec = matrix=>(...args)=>{for (let [pred,fn] of matrix){if(pred(...args)){return fn}}};
export const cond = (matrix)=>(...args)=>condNoExec(matrix)(...args)(...args);
export const and = rest(overEvery);
export const not = negate;
export const none = negate(overEvery);
export const or = rest(overSome)
export const xor = fn=>pipe(filter(fn),len1);
// debugging
export const plog = (fromDev)=>(...fromPipe)=>{console.log(fromDev,...fromPipe);return fromPipe[0];}

// casting
export const argsToArray = rest;
export const arrayToArgs = fn=>arr=>fn(...ensureArray(arr));
export const ensureArray = (val=[])=>isArray(val) ? val : [val];
export const ensureArgsArray = (...args)=>isArray(args[0])?args[0]:args;
export const acceptsArgsOrArray = fn=>pipe(argsToArray(flattenDeep),fn);
export const ensureFunction = ifElse(isFunction,identity,constant)
export const ensureProp = stubFn=>(obj,key)=>obj.hasOwnProperty(key) ? obj[key] : (obj[key]=stubFn());
export const ensureArrayProp = ensureProp(stubArray);
export const ensureObjectProp = ensureProp(stubObject);
export const arity1 = unary;
export const toEmptyCopy = cond([
  [isArray,stubArray],
  [isPlainObject,stubObject],
  [isString,stubString],
  [isWeakMap,()=>new WeakMap()],
  [isWeakSet,()=>new WeakSet()],
  [isMap,()=>new Map()],
  [isSet,()=>new Set()],
  [stubTrue,identity]
]);




// flow control
// export const pipe=(fn1,...fns)=>(arg1,...args)=>fns.reduce((a,f)=>f(a), fn1(arg1,...args));
// export const pipe=(fn1,...fns)=>(arg1,...args)=>fns.reduce((a,f)=>f(a), fn1(arg1,...args));
export const pipeAllArgs=(fn1,...fns)=>(arg1,...args)=>{
  let lastValidValue = arg1;
  let last=fn1(arg1,...args);
  if(last && last.pipeModifier){
    return last.pipeModifier({// don't love passing a mutable obj in but works for now.  Not a public api.
      _first:arg1,
      _args:args,
      _lastValid:arg1,
      _last:arg1
    });
  }
  lastValidValue = last;
  let i=-1;
  const L = fns.length;
  while(++i<L){
    last = fns[i](last,...args);
    if(last && last.pipeModifier){
      return last.pipeModifier({// don't love passing a mutable obj in but works for now.  Not a public api.
        _first:arg1,
        _args:args,
        _lastValid:lastValidValue,
        _last:last
      });
    }
    lastValidValue = last;
  }
  return lastValidValue;
}
const pipeAsyncFactory = (catchFn)=>(firstFn,...fns)=>(firstInput,...args)=>{ // enables
  const meta = {// don't love passing a mutable obj in but works for now.  Not a public api.
    _first:undefined,
    _args:args,
    _lastValid:undefined,
    _last:undefined
  };
  let pipeModifier;
  return Promise.resolve(firstInput)
  .then((firstVal)=>{
    meta._last = meta._first = meta._lastValid = firstVal;
    try{
      const result1 = firstFn(firstVal,...args);
      if(result1 && result1.pipeModifier){
        return result1.pipeModifier(meta);
      }
      meta._last = meta._lastValid = result1;
    } catch(e){
      meta._last = e;
    }
    return fns.reduce((lastPromise,fn,i)=>{
      return lastPromise.then(last=>{
        if(pipeModifier){return pipeModifier(meta);}
        if(last && last.pipeModifier){
          meta._last = last;
          pipeModifier=last.pipeModifier;
          return pipeModifier(meta);
        }
        meta._lastValid = meta._last = last;
        return fn(last,...args);
      })
      .catch(catchAndLogPipeError)
    },Promise.resolve(meta._last))
  })
  .catch(catchAndLogPipeError)
};

// pipeAsync - returns a promise
// desires:
//  reference first pipe arg,
//  reference last pipe arg (default)
//  reference last non-error
//  reference any of the above, while while transforming a subset (see demo films filter)
//  catches errors and allows subsequent fns to decide what to do with them
//  always returns promise
//  handles sync and async
//  enables aborting
//  Works with lodash/fp out of the box
//
export const reverse = arr=>arr.slice(0).reverse(); // immutable array reverse
export const pipe = (fn1=identity,...fns)=>(arg1,...args)=>fns.reduce((a,f)=>f(a),fn1(arg1,...args));
export const pipeAsync = (fn1=identity,...fns)=>pipeAllArgsAsync(fn1,...fns.map(arity1));
export const compose = (...fns)=>pipe(...fns.reverse());
export const composeAsync = (...fns)=>pipeAsync(...fns.reverse());



// functions that work with pipeAsync ... this whole section may be replaceable with observable streams
export const asPipeModifier = (fn)=>{
  const wrapper = (...a)=>fn(...a);
  wrapper._pipeModifier=true;
  return wrapper;
}
export const PIPE_ABORTED = Symbol('PIPE_ABORTED');
export const PIPE_FN_ABORTED = Symbol('PIPE_FN_ABORTED');
export const NOT_SET = Symbol('NOT_SET');
export const abortPipeWith= (fn)=>()=>({pipeModifier:fn});
export const abortPipeWithLastValid = abortPipeWith(({_lastValid})=>_lastValid)
export const abortPipeWithFirst = abortPipeWith(({_first})=>_first)
export const abortIf = (predicate)=>ifElse(predicate,abortPipeWithLastValid);
export const getPipeFirstValid = (...args)=>args[args.length-1].getfirstValidValue();
export const getPipeLastValid = (...args)=>args[args.length-1].getfirstValidValue();
export const catchAndLogPipeError = x=>{console.log(x);console.error(x);return x;}
export const resolvePipeError = identity;
export const pipeValueToError = x=>{throw x;};
export const logAndThrow = pipe(x=>{console.log('logAndThrow');return x;},catchAndLogPipeError,pipeValueToError);
export const logAndReset = pipe(x=>{console.log('logAndReset');return x;},catchAndLogPipeError,abortPipeWithFirst);
export const logAndAbort = pipe(x=>{console.log('logAndAbort');return x;},catchAndLogPipeError,abortPipeWithLastValid);
export const swallowPipeErrors = stubTrue;
export const ifError = fn=>ifElse(isJSError,fn,identity);
export const okElse = (onOkay,onError=logAndAbort)=>ifElse(isJSError,onError,onOkay);
const defaultCatcher = isProductionEnv() ? logAndReset : logAndReset;
export const pipeAllArgsAsync = pipeAsyncFactory(catchAndLogPipeError);









// content
export const lorem = (count=50)=>(new Array(count)).fill('lorem').join(' ');
export const cycle = (...args)=>{ // cycles between all values passed in
  let mod = -1;
  return ()=>args[++mod % args.length]
}




// collections
export const toArr = (fn,predicate=stubTrue)=>coll=>(transform((a,val,key,c)=>{
  if(predicate(a,val,key,c)){a[a.length]=fn(a,val,key,c)}
},[])(coll));
export const toObj = (fn,predicate=stubTrue)=>coll=>transform(ifElse(predicate,fn,noop),{})(coll);
// collection functions that always output to Obj
export const mapvToObjv = fn=>coll=>transform((a,val,key,c)=>a[key]=fn(val,key,c),{})(coll);// equivalent to _.mapValues, but works on arrays
// collection functions that always output to Array
export const mapvToArr = map
export const mapkToArr = pipe(rearg([1,0,2]),map);
export const fltrvToArr = filter;
// collection functions that retain the collection type
export const tranToArr = fn=>(...args)=>transform(fn,[])(...args);
export const tranToObj = fn=>(...args)=>transform(fn,{})(...args);
export const tran = transform;
export const fltrv = predicate=>coll=>(isArray(coll)?filter:pickBy)(predicate)(coll);
export const fltrk = rearg([1,0,2],fltrv);
export const omitv = pipe(not,fltrv);
export const omitk = pipe(not,fltrk);
export const mapv = fn=>ifElse(isArray,map(fn),mapValues(fn));
export const mapk = rearg([1,0,2],mapv);
export const fltrMapvToArr = (predicate,fn)=>(...args)=>transform((a,v,k,c)=>{
  if(predicate(v,k,c)){a[a.length]=fn(v,k,c)};
},[])(...args);
export const fltrMapvToObjv = (predicate,fn)=>(...args)=>transform((a,v,k,c)=>{
  if(predicate(v,k,c)){a[k]=fn(v,k,c)};
},{})(...args);
export const fltrMapv = (predicate,fn)=>ifElse(isArray,fltrMapvToArr,fltrMapvToObjv)(predicate,fn)

export const values = (arg={})=>isFunction(arg.values)?arg.values():Object.values(arg);
export const keys = (arg={})=>isFunction(arg.keys)?arg.keys():Object.keys(arg);
// console.log(`mapvToArr()({a:'b',c:'d'})`, mapvToArr()({a:'b',c:'d'}));


export const sort = (...args)=>arr=>arr.sort(...args)
export const toggleArrayVal = ifElse(v=>a=>a.includes(v),reject,v=>a=>[...a,v]);
export const transformToObj = fn=>obj=>transform(fn,{})(obj);
// groupByProps: like groupBy https://lodash.com/docs/4.17.5#groupBy
// but enables returning an object
// sort of like Object.assign({},...map(groupBy)(collection))
export const groupByProps = (propTransformer=identity)=>transformToObj((dest,src)=>{
  forOwn((val,key)=>{propTransformer(dest[key],src[key],key,dest,src)})(src);
});
export const assignPropsToArrays = groupByProps((dv,sv,k,d,s)=>ensureArrayProp(d,k).push(sv));
export const groupByKey = (key)=>groupByProps((dv,sv,k,d,s)=>k===key && ensureArrayProp(d,k).push(s))
export const groupByKeys = groupByProps((dv,sv,k,d,s)=>ensureArrayProp(d,k).push(s))
export const groupByValues = groupByProps((dv,sv,k,d,s)=>ensureArray(sv).forEach(v=>ensureArrayProp(d,v).push(s)));
// const aColl = [{a:[1,2]}, {b:[2]}, {c:[1,3]}];
// groupByKey('a')(aColl) // {a:[{a:[1,2]}]}
// groupByKeys(aColl) // {a:[{a:[1,2]}],b:[{b:[2]}],c:[{c:[1,3]}]}
// groupByValues(aColl) // {1: [{a:[1,2]},{c:[1,3]}], 2: [{a:[1,2]},{b:[2]}], 3: [{c:[1,3]}]}
// pipe(map(pick(['a','b'])),groupByValues)(aColl) // {1:[{a:[1,2]}], 2:[{a:[1,2]}, {b:[2]}]}
// const oColl = {a:{d:[1,2]}, b:{d:[2]}, c:{d:[1,3]}};
// groupByKey('d')(oColl) // {d:[{d:[1,2]},{d:[2]},{d:[1,3]}]}
// groupByKeys(oColl) // {d:[{d:[1,2]},{d:[2]},{d:[1,3]}]}
// groupByValues(aColl) // {1:[{d:[1,2]},{d:[1,3]}], 2:[{d:[1,2]},{d:[2]}], 3:[{d:[1,3]}]}
export const getMatchReplacer = replacer=>(p,f)=>replacer(p,ensureFunction(f));

export const replaceInSelf = getMatchReplacer((predicate,getReplacement)=>collection=>transform((d,sv,k,s)=>{
  if(predicate(sv,k,s)) {d[k] = getReplacement(sv,k,s)}
},collection)(collection));

export const replaceInCopy = getMatchReplacer((predicate,getReplacement)=>collection=>transform((d,sv,k,s)=>{
  d[k] = predicate(sv,k,s) ? getReplacement(sv,k,s) : sv
},toEmptyCopy(collection))(collection));

export const replaceInEmpty = getMatchReplacer((predicate,getReplacement)=>collection=>transform((d,sv,k,s)=>{
  if(!predicate(sv,k,s)) {return;}
  if(isArray(d)){k=d.length}
  d[k] = getReplacement(sv,k,s)
},toEmptyCopy(collection))(collection));

export const concatAfter = getMatchReplacer((predicate,getReplacement)=>collection=>collection.reduce((d,sv,k,s)=>{
  d[d.length]=sv;
  console.log(`predicate(sv,k,s)`, sv,k,s);
  if(predicate(sv,k,s)){d.push(...ensureArray(getReplacement(sv,k,s)))}
  return d;
},[]));

export const concatBefore = getMatchReplacer((predicate,getReplacement)=>collection=>collection.reduce((d,sv,k,s)=>{
  if(predicate(sv,k,s)){d.push(...ensureArray(getReplacement(sv,k,s)))}
  d[d.length]=sv;
  return d;
},[]));


// Objects
export const pget = cond([
  [isFunction,identity],
  [isString,get],
  [isArray,pick],
  [isPlainObject, fnsObj=>targetObj=>mapv((fn,k)=>(pget(fn))(targetObj))(fnsObj)],
  [stubTrue,identity],
]);

export const objStringifierFactory = ({
  getPrefix=()=>'',
  getSuffix=()=>'',
  mapPairs=x=>x,
  keySplit = '=',
  pairSplit = '&'
} = {})=>(input={})=>{
  const output = Object.keys(input)
  .map(k=>([k, input[k]].map(mapPairs).join(keySplit)))
  .join(pairSplit);
  return getPrefix(input,output) + output + getSuffix(input, output);
};
export const objToUrlParams = objStringifierFactory({
  getPrefix:(input,output)=>output ? '?' : '',
  mapPairs:encodeURIComponent,
});

// partionObject((v,k)=>k=='a')({a:1,b:2,c:3}) =>[{a:1},{b:1,c:2}]
// partionObject((v,k)=>v==1)({a:1,b:2,c:3}) =>[{a:1,b:1},{c:2}]
export const partitionObject = (...predicates)=>(target)=>{
  const defaultCase = {...target};
  return predicates.map(test=>{
    return transform((acc,val,key)=>{
      if(!test(val,key)){return;}
      acc[key]=val;
      delete defaultCase[key];
    },{})(defaultCase);
  }).concat([defaultCase]);
}



// Math
export const round = Math.round.bind(Math);
