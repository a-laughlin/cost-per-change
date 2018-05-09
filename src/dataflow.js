import {initialState} from './initial-state';
import {createStore} from 'redux';
import {setObservableConfig,createEventHandler,mapPropsStream,componentFromStream} from 'recompose';
import {
  pipe,compose,mapv,plog as plogg,get,identity,pget,pgetv,ensureArray,set,isObservable,assignAll,
  mapvToArr,isFunction,ensureFunction,groupByKey
} from './utils';
import {xs,map,debug,from,combineWith,flatten,flattenConcurrently,flattenSequentially,addListener,
  addDebugListener,setDebugListener} from './xstream-fp.js';
import xstreamConfig from 'recompose/xstreamObservableConfig';
setObservableConfig(xstreamConfig);


const plog = pipe(plogg,debug);
export const joinFactory = ({srcKey='data',destKey='value'}={})=>(coll$,dest=destKey)=>mapPropsStream(pipe(
  combineWith(coll$),
  map((args)=>{
    console.log(`coll$`, coll$);
    console.log(`args`, args);
    return args;
  }),
  map(([{[srcKey]:data},coll])=>(
    dest ? {data,[dest]:get(data)(coll)} : {data}
  )),
));
export const $defaultValue=joinFactory({destKey:'defaultValue'});
export const $value=joinFactory({destKey:'value'});
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

// const rootReducer = (state,action)=>action;
// const tapUpdater = updater=>pipe(plog('prevState'),updater,plog('nextState')),
const store = createStore(
  (state=initialState,{updater=identity})=>updater(state),
  // (state,{updater=identity})=>pipe(plogg('prevState'),updater,plogg('nextState'))(state),
  // initialState
);
// console.log(`store[Symbol.observable]()`, store[Symbol.observable]());
const dispatch = store.dispatch.bind(store);
const setStateX = str=>data=>{dispatch({type:'fn',updater:state=>set(str,data,state)}); return data; };
const assignToStateX = data=>{dispatch({type:'fn',updater:state=>Object.assign({},state,...ensureArray(data))});return data;}


const store$ = xs.from(store[Symbol.observable]()).startWith(initialState);
const streamFactory = str=>input$=>{
  const [collName,propName]=str.split('_');
  return ({
    [str+'$']:map((propName?mapv(propName):get(collName)))(input$),
    [`to_${str}$`]:({value,data})=>setStateX(str.replace('_',`[${data}]`))(value)
  })
};


// repos
export const {repos$,to_repos$}=streamFactory('repos')(store$);
export const {repos_devcost$,to_repos_devcost$}=streamFactory('repos_devcost')(repos$);
export const {repos_changetime$,to_repos_changetime$}=streamFactory('repos_changetime')(repos$);


// files
export const {repoNodes$,to_repoNodes$} = streamFactory('repoNodes')(store$);
export const repoNodesByRepoid$ = repoNodes$.map(groupByKey('repoid'));
export const {repoNodes_repoid$,to_repoNodes_repoid$} = streamFactory('repoNodes_repoid')(repoNodes$);


export const repoNodeOutEdges$ = map(get('repoNodeOutEdges'))(store$);
export const userTokens$ = map(get('userTokens'))(store$);
export const helpMessage$ = map(get('helpMessages.0'))(store$);
