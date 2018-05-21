import {createStore} from 'redux';
import {hierarchy} from 'd3';
import {setObservableConfig,createEventHandler,mapPropsStream,componentFromStream,shallowEqual} from 'recompose';
import {
  pipe,compose,mapv,plog,get as _get,identity,pget,pgetv,ensureArray,set,isObservable,assignAll,
  mapvToArr,isFunction,ensureFunction,groupByKey,ife,isString,cond,stubTrue,transformToObj,
  omitv,matches,fltrvToObj,isPlainObject,isNumber,ro,unzip,zipObject,mo,isArray,fa,pick,isObjectLike,
  every,not,isUndefOrNull,isPromise,or,partition,ma,spread
} from './lib/utils';
import {of$,from$,combine$,map,debug,debounce,from,combineWith,flatten,flattenConcurrently,flattenSequentially,addListener,
  addDebugListener,setDebugListener,dropRepeats,flatMapLatest,flatMap,sampleCombine,getDebugListener,
  removeListener,getListener,subscribe,fold,drop,periodic$,filterChangedItems,takeWhenPropChanged,filter,
  ensureObservable,remember,flattenDeep,fromPromise$
} from './lib/utils$.js';
import {analyse} from './analyse';
import {loadRepoGraph} from './api'
import {initialState} from './static/initial-state';
initialState.userTokens['0'].value = process.env.REACT_APP_GITHUB_TOKEN;


export const simpleStore = (initialState={})=>{
  const {stream,handler}=createEventHandler();
  const store$ = stream.fold((state,{updater=identity})=>updater(state),initialState);
  const dispatch = fn=>handler({type:'fn',updater:fn});// mock redux dispatch for compatibility
  return {store$,dispatch};
}
export const get$ = cond(
  // ordering based on lodash source code, for minimum checks
  [or(isString,isNumber),s=>v=>isObservable(v)?map(_get(s))(v):of$(_get(s)(v))],
  [isObservable,obs$=>props=>obs$],
  [isArray,arr=>props=>combine$(of$(props),...arr.map(v=>get$(v)(props)))],
  [isFunction, fn=>props=>get$(fn(props))(props)],
  [isPromise, prom=>props=>fromPromise$(prom)],
  [isObjectLike, obj=>target=>{
    console.log(`get$`, get$);
    const mapped = mo(v=>get$(v)(target))(obj);
    const [keys,vals$] = unzip(Object.entries(mapped));
    return combine$(...vals$).map(vals=>Object.assign(zipObject(keys,vals),target));
  }],
  [stubTrue,x=>props=>ensureObservable(x)],
);
export const hget$ = compose(mapPropsStream,flatMap,get$);

export const idxMapFactory = (dataKey='data')=>(...streamsAndArgs)=>props$=>{
  const [streams$,fns]=partition(isObservable)(streamsAndArgs);
  return combine$(ensureObservable(props$),...streams$).map(
    pipe(
      ([props,...streams])=>streams.map(s=>s[props[dataKey]]),
      spread(pipe(...fns.map(f=>pget(f)))),
    )
  );
};

export const from_target_value = pget({value:'target.value',data:'data'});

const getHandler = (...fns)=>{
  const {stream,handler} = createEventHandler();
  pipe( ...fns, addListener() )(stream);
  return handler;
};



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
// const t0 = {id:'t0',val:'0'};
// const t01 = {id:'t0',val:'01'};
// const t1 = {id:'t1',val:'1'};
// const tColl={tColl:{t0}};
const tapUpdater = updater=>pipe(plog('prevState'),updater,plog('nextState'));
// const tapUpdater = identity;
// const store = createStore((state=initialState,{updater=identity})=>updater(state));
const store = createStore((state,{updater=identity})=>tapUpdater(updater)(state),initialState);
const store$ = from$(store[Symbol.observable]()).remember();//.startWith(initialState);
// addDebugListener()(store$);
const dispatch = store.dispatch.bind(store);

// data is props.data
const tplRegex = /\[prop\]\.|\.?prop\./g;
const tpl = string=>data=>string.replace(tplRegex,`[${data}].`);
const setStateX = str=>({value,data=''})=>{dispatch({type:'fn',updater:state=>set(tpl(str)(data),value,state)}); return value; };
const assignToStateX = data=>{
  console.log(`data`, data);
  dispatch({type:'fn',updater:state=>Object.assign({},state,...ensureArray(data))});return data;
}

// assumes collections will not be added or removed
// assumes collection items will be added and removed

export const [
  repos$, repoNodes$, repoNodeOutEdges$, userTokens$
] = [
  'repos','repoNodes','repoNodeOutEdges','userTokens'
].map(name=>pipe(
  map(s=>s[name]),
  filterChangedItems(),
  remember,
)(store$));

export const to_repos$ = setStateX('repos');
export const to_repo_devcost$ = setStateX('repos.prop.devcost');
export const to_repo_changetime$ = setStateX('repos.prop.changetime');
export const to_repo_url$ = setStateX('repos.prop.url');



// files/directory nodes
export const to_repoNodes$ = setStateX('repoNodes');
export const repoNodes_costPerChange$ = pipe(map(mapv('costPerChange')),remember)(repoNodes$);
export const repoNodes_userImpact$ = pipe(map(mapv('userImpact')),remember)(repoNodes$);
export const repoNodes_path$ = pipe(map(mapv('path')),remember)(repoNodes$);


// user github token
export const userToken$ = pipe(map(_get('0.value')),dropRepeats,remember)(userTokens$);
export const to_userToken$ = setStateX('userTokens.0.value');


// analyses
export const nodeAnalyses$ = pipe(
  ()=>combine$(repoNodes$,repos$),
  map(([repoNodes,repos])=>{
    const repoData = {costPerChangeMax:0,costPerChangeMin:Infinity};
    let minKey,maxKey;
    return ro((acc,node)=>{
      if(!node.code){return;}
      repoData.devcost = repos[node.repoid].devcost;
      repoData.changetime = repos[node.repoid].devcost;
      const {analysis,code} = analyse(node.path,node.code);
      const n = {...node,code};
      mapv((v,k)=>{
        if(!isNumber(v)){return;}
        minKey = `${k}Min`;
        maxKey = `${k}Max`;
        if(!repoData.hasOwnProperty(minKey)){repoData[minKey]=v;}
        if(!repoData.hasOwnProperty(maxKey)){repoData[maxKey]=v;}
        if(repoData[minKey]>v){repoData[minKey]=v;}
        if(repoData[maxKey]<v){repoData[maxKey]=v;}
        n[k]=v;
      })(analysis);
      // this might go negative if maintainability really sucks
      n.costPerChange = (171-n.maintainability)/1000*repoData.devcost*repoData.changetime;
      n.userImpact = n.cyclomatic;//+analysis.params.length/analysis.functions.length
      if(repoData.costPerChangeMin>n.costPerChange){repoData.costPerChangeMin=n.costPerChange;}
      if(repoData.costPerChangeMax<n.costPerChange){repoData.costPerChangeMax=n.costPerChange;}
      acc[n.id] = Object.assign(n,repoData,{id:n.id,repoid:n.repoid});
    })(repoNodes);
  }),
  filterChangedItems(),
  remember,
)();


// joins
// export const repos_by_repoNode_id$ = store$
// // why didn't it work to use combine$ or combineWith?  Why directly from the store$?
// .map(({repoNodes,repos})=>mapv(n=>repos[n.repoid])(repoNodes));
// export const repos_by_repoNode_id$ = combineArray$(repos$,repoNodes$).map(([r,nodes])=>mapv(n=>r[n.repoid])(nodes));
// export const repos_by_repoNode_id$ = combine$(repos$,repoNodes$).map(([r,nodes])=>mapv(n=>r[n.repoid])(nodes));
export const repos_by_repoNode_id$ = pipe(
  ()=>combine$(repos$,repoNodes$),
  map(([r,nodes])=>mapv(n=>r[n.repoid])(nodes)),
  remember,
)();


export const nodeAnalyses_by_repoid$ = pipe(
  map(ro((acc,n,nid)=>{
    const {repoid,id} = n
    acc[repoid] || (acc[repoid] = {});
    acc[repoid][id]=n;
  })),
  remember,
)(nodeAnalyses$);

export const repoNodes_by_repoid$ = pipe(
  map(ro((acc,n,nid)=>{
    const {repoid,id} = n
    acc[repoid] || (acc[repoid] = {});
    acc[repoid][id]=n;
  })),
  remember,
)(repoNodes$);

export const repoNodeOutEdges_by_repoid$ = pipe(
  map(ro((acc,edge)=>{
    const {repoid,id} = edge;
    acc[repoid] || (acc[repoid] = {});
    acc[repoid][id]=edge;
  })),
  remember,
)(repoNodeOutEdges$);

export const d3TreeStructure_by_repoid$ = pipe(
  ()=>combine$(repoNodeOutEdges$,repoNodes$),
  map(([repoNodeOutEdges,repoNodes])=>{
    console.log(`treeStructure`,repoNodeOutEdges,repoNodes);
    const rootNodes = {...repoNodes};
    const adjList = mo((outEdgeObj,nodeKey)=>outEdgeObj.edges.map((edgeKey)=>{
      delete rootNodes[edgeKey];
      return repoNodes[edgeKey];
    }))(repoNodeOutEdges);
    const result = ro((acc,rootNode,k)=>{
      // map nodes to tree object with parent, children, height, depth properties
      acc[rootNode.repoid] = hierarchy(rootNode,n=>adjList[n.id]);
    })(rootNodes);
    console.log(`treeStructure result`, result);
    return result;
  }),
  remember,
)();



// multi-actions
export const to_repo_copy = getHandler(
  sampleCombine(repos$,repoNodes$,repoNodeOutEdges$),
  map(([id,repos,repoNodes,repoNodeOutEdges])=>{
    const repoid=id+'_1';
    const re = new RegExp(id,'g');
    const sRepo=(str)=>str.replace(re,repoid);
    const transformRepo = (acc,v,k)=>{ acc[k]=v; if(k===id){acc[repoid]={...v,id:repoid,repoid}}};
    const transformNode = (acc,v,k)=>{
      acc[k]=v;
      if (v.repoid===id) {
        const fid = sRepo(k);
        acc[fid]={...v,id:fid,repoid};
        if(v.edges){acc[fid].edges=v.edges.map(sRepo);}
      };
    };
    return assignToStateX({
      repos:transformToObj(transformRepo)(repos),
      repoNodes:transformToObj(transformNode)(repoNodes),
      repoNodeOutEdges:transformToObj(transformNode)(repoNodeOutEdges),
    });
  })
);

export const to_repo_remove = getHandler(
  sampleCombine(repos$,repoNodes$,repoNodeOutEdges$),
  map(([id,repos,repoNodes,repoNodeOutEdges])=>{
    assignToStateX({
      repos:omitv(matches({id}))(repos),
      repoNodes:omitv(matches({repoid:id}))(repoNodes),
      repoNodeOutEdges:omitv(matches({repoid:id}))(repoNodeOutEdges),
    });
  })
);
// export const to_repo_url= setStateX('repos.prop.url');
export const to_repo_url = getHandler(
  debounce(500),
  filter(({value})=>!!value),
  sampleCombine(repos$,repoNodes$,repoNodeOutEdges$,userToken$),
  map(([props,allRepos,allrepoNodes,allRepoNodeOutEdges,token])=>{
    const {data:id,value:url} = props;
    console.log(`requesting`,{url,id,token});
    loadRepoGraph({url,id,token})
    .then(({repoNodes:newNodes,repoNodeOutEdges:newEdges})=>{
      console.log(`received`,newNodes,newEdges);
      let maxKey,minKey;
      const repo = {...allRepos[id],url}; // add url
      const repos = {...allRepos,[id]:repo};
      // const omittedNodes = omitv(matches({repoid:id}))(allrepoNodes);
      // console.log(`omittedNodes`, omittedNodes);
      const repoNodeOutEdges = {...omitv(matches({repoid:id}))(allRepoNodeOutEdges),...newEdges};
      const repoNodes = {...omitv(matches({repoid:id}))(allrepoNodes), ...newNodes};
      assignToStateX({repos,repoNodes,repoNodeOutEdges})
    });
  })
);
