import {initialState} from './initial-state';
import {createStore} from 'redux';
import {setObservableConfig,createEventHandler,mapPropsStream,componentFromStream} from 'recompose';
import {
  pipe,compose,mapv,plog,get,identity,pget,pgetv,ensureArray,set,isObservable,assignAll,
  mapvToArr,isFunction,ensureFunction,groupByKey,ifElse,isString,cond,stubTrue
} from './utils';
import {of$,from$,combine$,map,debug,from,combineWith,flatten,flattenConcurrently,flattenSequentially,addListener,
  addDebugListener,setDebugListener,dropRepeats,flatMapLatest,flatMap} from './utils$.js';
import xstreamConfig from 'recompose/xstreamObservableConfig';
setObservableConfig(xstreamConfig);


const tplRegex = /\[prop\]\.|\.?prop\./g;
const tpl = s=>prop=>s.replace(tplRegex,`[${prop}].`);
const ensureStreamGetter = cond([
  [isFunction,x=>prop=>x(prop)],
  [isObservable,x=>prop=>map(get(prop))(x)],
  [isString,x=>prop=>map(tpl(x)(prop))(store$)],
  [stubTrue,x=>prop=>of$(x)],
]);
export const mapPropHocFactory = (dataKey='data')=>obj=>{
  const keys = Object.keys(obj);
  const getterFns = Object.values(obj).map(ensureStreamGetter);
  return mapPropsStream(pipe(
    flatMap((props)=>combine$(...getterFns.map(fn=>fn(props[dataKey])))),
    map(latestVals=>latestVals.reduce((acc,v,i)=>{acc[keys[i]]=v;return acc;},{})),
    debug('afterMapping')
  ));
};
export const mapProp = mapPropHocFactory();

export const from_target_value = pget({value:'target.value',data:'data'});
// fromStream('helpMessages.0')

// Store only contains collections.  Everything else is derived.
// collections named like repo,repofile - id property matches the collection

// streams (there are a number of cases in the code where these separate concerns better)
// event.merge(store).merge(sideload).merge(props).dostuff().to(store$).publish()
// const isClickedProducer$ = Producer();
// map(merge(props$,isClicked$,store$)));
// streamClicks(merge(event$,props$,state$),dostuff,to$(isClickedProducer$,state$)))) // publishes an observable to store
// event.merge(storeInfo).select(storeSlice).map(toNextSlice).merge(storeInfo).publish()

// possible fns
// set, merge, remove
// const setMatchingItems (str,matcher)(value)=>
// const setMatchingItems (str)(value)=>
// setProp
// mergeProp
// setColls
// mergeColls
// removeColls
// setCollection
// setCollectionProp
// setCollectionItem
// setCollectionItemProp
// mergeCollection
// mergeCollectionProp
// mergeCollectionItem
// mergeCollectionItemProp
// removeCollection
// removeCollectionProp
// removeCollectionItem
// removeCollectionItemProp
// setItemsMatchingId
// mergeItemsMatchingId
// removeItemsWithMatchingId

// const tapUpdater = updater=>pipe(plog('prevState'),updater,plog('nextState')),
const store = createStore((state=initialState,{updater=identity})=>updater(state));
const store$ = from$(store[Symbol.observable]()).startWith(initialState);
const dispatch = store.dispatch.bind(store);


const setStateX = str=>({value,data=''})=>{dispatch({type:'fn',updater:state=>set(tpl(str)(data),value,state)}); return value; };
const assignToStateX = data=>{dispatch({type:'fn',updater:state=>Object.assign({},state,...ensureArray(data))});return data;}


export const repos$ = map(get('repos'))(store$);
export const to_repos$ = setStateX('repos');
// why are these dropRepeats necessary?
export const repos_devcost_by_id$ = pipe(dropRepeats,map(mapv('devcost')))(repos$);
export const repos_changetime_by_id$ = pipe(dropRepeats,map(mapv('changetime')))(repos$);
export const to_repo_devcost$ = setStateX('repos.prop.devcost');
export const to_repo_changetime$ = setStateX('repos.prop.changetime');



// files/directory nodes
export const [repoNodes$,to_repoNodes$] = [map(get('repoNodes'))(store$),setStateX('repoNodes')];
export const repoNodes_repoid$ = map(mapv('repoid'))(repoNodes$);

// differently indexed
export const repoNodes_by_repoid$ = map(groupByKey('repoid'))(repoNodes$);



// file/directory edges
export const repoNodeOutEdges$ = map(get('repoNodeOutEdges'))(store$);
export const repoNodeOutEdges_by_repoid$ = map(groupByKey('repoid'))(repoNodeOutEdges$);

// user github token
export const userToken$ = map(get('userTokens.0.value'))(store$);
export const to_userToken$ = setStateX('userTokens.0.value');
