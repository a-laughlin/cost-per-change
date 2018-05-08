import {initialState} from './initial-state';
import {createStore} from 'redux';
import {setObservableConfig,createEventHandler,mapPropsStream,componentFromStream} from 'recompose';
import {pipe,compose,mapv,plog as plogg,get,identity,pget,pgetv,ensureArray,set} from './utils';
import {xs,map,debug,from,sampleCombine,flatten} from './xstream-fp.js';
import {tpl} from './hoc-utils';
import xstreamConfig from 'recompose/xstreamObservableConfig';
setObservableConfig(xstreamConfig);

const plog = pipe(plogg,debug);
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
  (state,{updater=identity})=>pipe(plogg('prevState'),updater,plogg('nextState'))(state),
  initialState
);
// console.log(`store[Symbol.observable]()`, store[Symbol.observable]());
const dispatch = store.dispatch.bind(store);
export const assignToStateX = data=>{
  dispatch(state=>Object.assign({},state,...ensureArray(data)));
  return data;
}
export const toStateX = str=>data=>{dispatch({type:'fn',updater:state=>set(str,data,state)}); return data; };



// console.log(`xs`, xs);
const store$ = xs.from(store[Symbol.observable]());
const state$ = (...fns)=>pipe(...fns)(store$);

export const repos$ = state$(map(get('repos')));
//new
export const repos_devcost$ = map(mapv(get('devcost')))(repos$);
export const to_repos_devcost$ = ({value,data})=>toStateX(`repos[${data}].devcost`)(value);
export const mapCollectionStream = obj => mapPropsStream(pipe(
  // instead of a custom "from" function, just have it automatically map the data prop
  map((props)=>{
    return xs.from(
      Object.entries(obj)
      .map(([k,other$])=>{
        return other$.map((other)=>{
          return {[k]:other[props.id],id:props.id};
        });
      })
    )
  }),
  flatten,
  flatten,
  map(x=>{
    console.log(`x`, x);
    return x;
  }),
));

// const DevCostPerHour = TextInput(
//   mapPropsStream(pipe(
//     props$=>sampleCombine(props$,repos_devcost$),
//     map(([{id},byId])=>console.log(byId[id])||({defaultValue:byId[id],id}))
//   )),
//   pipeChanges(from({value:'target.value',data:'id'}),to_repos_devcost$),
//   h('w3')
// );

export const repoNodes$ = state$(map(get('repoNodes')));
export const repoNodeOutEdges$ = state$(map(get('repoNodeOutEdges')));
export const userTokens$ = state$(map(get('userTokens')));
export const helpMessage$ = state$(map(get('helpMessages.0')));
