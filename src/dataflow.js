import {createStore} from 'redux';
import {hierarchy} from 'd3';
import {setObservableConfig,createEventHandler,mapPropsStream,componentFromStream,shallowEqual} from 'recompose';
import {
  pipe,compose,mapv,plog,get as _get,identity,pget,pgetv,ensureArray,set,isObservable,assignAll,
  mapvToArr,isFunction,ensureFunction,groupByKey,ife,isString,cond,stubTrue,
  omitv,matches,fltrvToObj,isPlainObject,isNumber,ro,unzip,zipObject,mo,isArray,fa,fo,pick,isObjectLike,
  every,not,isUndefOrNull,isPromise,or,partition,ma,spread,get,dpipe,ifenx,is,split,ra,argsToArray
} from './lib/utils';
import {of$,from$,combine$,map,debug,debounce,from,combineWith,flatten,flattenConcurrently,flattenSequentially,addListener,
  addDebugListener,setDebugListener,dropRepeats,flatMapLatest,flatMap,sampleCombine,getDebugListener,
  removeListener,getListener,subscribe,fold,drop,periodic$,takeWhenPropChanged,filter,
  ensureObservable,remember,flattenDeep,fromPromise$,collection$
} from './lib/utils$.js';
import {analyse} from './analyse';
import {loadRepoGraph} from './api'
import {initialState} from './static/initial-state';




export const from_target_value = pget({value:'target.value',data:'data'});

const getHandler = (...fns)=>{
  const {stream,handler} = createEventHandler();
  pipe( ...fns, addListener() )(stream);
  return handler;
};



initialState.userTokens['0'].value = process.env.REACT_APP_GITHUB_TOKEN;
const tapUpdater = updater=>pipe(plog('prevState'),updater,plog('nextState'));
const store = createStore((state,{updater=identity})=>tapUpdater(updater)(state),initialState);
const store$ = from$(store[Symbol.observable]()).remember();
const dispatch = store.dispatch.bind(store);

const cache = {
  o:store$,
  latest:initialState,
  c:{},
}

const toLevelMappersDefault = ma(part=>(lvl,mapPath,preObserve)=>lvl.c[part]||(lvl.c[part]={
  o:dpipe(lvl.o,map(parent=>mapPath(parent,lvl,part)),preObserve),
  latest:'',
  c:{}
}));
const mapPathDefault = (parent,lvl,part)=>(lvl.c[part].latest = parent[part]);
export const getCached =({
  mapOutput = identity,
  mapPath = mapPathDefault,
  toLevelMappers = toLevelMappersDefault
}={})=>pipe(
  ensureArray,
  toLevelMappers,
  pm=>pm.reduce((lvl,fn)=>fn(lvl,mapPath,mapOutput),cache)
)

const logCache = msg=>(output)=>{
  console.log(msg,`output`, output);
  const inner = (lvl=cache,mapped={})=>{
    if(!isPlainObject(lvl.latest)){return lvl.latest;}
    if(lvl._){
      mapped._ = mo(ife(isString),identity,v=>typeof v)(lvl._.latest);
    }
    let k;
    for(k in lvl.c){
      mapped[k]=inner(lvl.c[k]);
    }
    return mapped;
  };
  console.log(msg,`cache`, JSON.stringify(inner(cache),null,1));
  console.log(msg,`raw cache`, cache);
  return output;
}
const logoutput = msg=>(out)=>(isObservable(out)?map:identity)(logCache(msg))(out);

export const getCached$ = (args)=>pipe(getCached(args),({o})=>o);
const getCachedUnique$ = getCached$({mapOutput:pipe(dropRepeats,remember)});
const parse$ = args=>pipe(split('.'),getCached(args));
const parseUnique$ = pipe(split('.'),getCachedUnique$);
export const tpltemp = (s,props)=>s.replace(/\[(.+?)\]/g,(_,key)=>`.${props[key]}.`);
export const pcacheOne$ = (str)=>pipe( props=>tpltemp(str,props).split('.'), getCachedUnique$);
export const pcache$ = (...strs)=>props=>{
  return strs.length===0
    ? of$(undefined)
    : strs.length > 1
      ? combine$(...strs.map(s=>pcacheOne$(s)(props)))
      : pcacheOne$(strs[0])(props);
};


export const [
  repos$, repoNodes$, repoNodeOutEdges$, userTokens$, analysisMods$,
] = ['repos','repoNodes','repoNodeOutEdges','userTokens','analysisMods']
.map(getCachedUnique$);

// these are the only events to handle!!
// collections
// collections items adding
// collections items removing
// collection item props updating

// why? managing state updates, observerable updates, combining streams, is challgenging to get right
// inspired by mobx and redux, more fp, opinionated state structure
// const idxget$('repos','repo0','url');
// how dynamically create indices?
// (edit: see the getLevelMapper fn - enables handling on a per-part basis)
// const idx$ = parse$({mapOutput:pipe(fold(),drop(1),dropRepeats,remember)})
  // ('repNodes',get()by.repos.[repoid]')

// dpipe(
//   cache$('repoNodeOutEdges.data.edges')({data:'repo0_root'}),
//   logoutput('repoNodeOutEdges.data.edges.0'),
//   addDebugListener
// );










// data is props.data
const tplRegex = /\[prop\]\.|\.?prop\./g;
const tpl = string=>data=>string.replace(tplRegex,`[${data}].`);
const setStateX = str=>({value,data=''})=>{dispatch({type:'fn',updater:state=>set(tpl(str)(data),value,state)}); return value; };
const assignToStateX = data=>{
  dispatch({type:'fn',updater:state=>Object.assign({},state,...ensureArray(data))});
  return data;
}

// assumes collections will not be added or removed
// assumes collection items will be added and removed


export const to_repos$ = setStateX('repos');
export const to_repo_url$ = setStateX('repos.prop.url');

export const analysisMods_by_repoid$ = analysisMods$;
export const to_analysisMods_devcost = setStateX('analysisMods.prop.devcost')
export const to_analysisMods_changetime = setStateX('analysisMods.prop.changetime')

// files/directory nodes
export const to_repoNodes$ = setStateX('repoNodes');


// user github token
export const userToken$ = parseUnique$('userTokens.0.value');
export const to_userToken$ = setStateX('userTokens.0.value');

export const codeAnalysesRaw$ = dpipe(
  repoNodes$,
  fold((prevAnalyses,repoNodes)=>{
    let changes = 0,nextLen=0;
    const analyses = mo((n,id)=>{
      if(prevAnalyses[id]){return prevAnalyses[id];}
      changes++;
      return {id,...analyse(n.path,n.code)};
    })(repoNodes);
    return changes===0 ? prevAnalyses : analyses;
  },{}),
  drop(1),
  dropRepeats,
  remember,
);


export const nodeAnalyses$ = dpipe(
  combine$(codeAnalysesRaw$,analysisMods_by_repoid$),
  sampleCombine(repoNodes$),
  fold((prevAnalyses,[[analyses,mods],repoNodes])=>{
    const repoData = {costPerChangeMax:0,costPerChangeMin:Infinity};
    let minKey,maxKey;
    const result = ro((acc,node,nodeid)=>{
      if(!node.code){return;}
      repoData.devcost = mods[node.repoid].devcost;
      repoData.changetime = mods[node.repoid].changetime;
      const {analysis, code} = analyses[nodeid];
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
    return result;
  },{}),
  drop(1),
  dropRepeats,
  remember,
);

// joins
// export const repos_by_repoNode_id$ = store$
export const repos_by_repoNode_id$ = dpipe(
  combine$(repos$,repoNodes$),
  map(([r,nodes])=>mapv(n=>r[n.repoid])(nodes)),
  remember,
);

export const createIdx = (fk,pk)=>ro((acc,next)=>{
  const [id,fid]=[next[pk],next[fk]];
  acc[fid] || (acc[fid] = {});
  acc[fid][id]=next;
});
export const repoNodes_by_repoid$ = pipe(map(createIdx('repoid','id')), remember )(repoNodes$);
export const nodeAnalyses_by_repoid$ = pipe(map(createIdx('repoid','id')), remember )(nodeAnalyses$);
export const repoNodeOutEdges_by_repoid$ = pipe(map(createIdx('repoid','id')), remember )(repoNodeOutEdges$)

export const d3TreeStructure_by_repoid$ = pipe(
  ()=>repoNodeOutEdges$,
  sampleCombine(repoNodes$),
  fold((prev,[repoNodeOutEdges,repoNodes])=>{
    const rootNodes = {...repoNodes};
    const adjList = mo((outEdgeObj,nodeKey)=>outEdgeObj.edges.map((edgeKey)=>{
      delete rootNodes[edgeKey];
      return repoNodes[edgeKey];
    }))(repoNodeOutEdges);
    let changes=0;
    const result = ro((acc,rootNode,id)=>{
      // map nodes to tree object with parent, children, height, depth properties
      const prevRoot = prev[rootNode.repoid];
      if(prevRoot && prevRoot.id===id){acc[rootNode.repoid]=prevRoot;return;}
      changes++;
      acc[rootNode.repoid] = hierarchy(rootNode,n=>adjList[n.id]);
    })(rootNodes);
    return changes?result:prev;
  },{}),
  drop(1),
  dropRepeats,
  remember,
)();


// multi-actions
export const to_repo_copy = getHandler(
  sampleCombine(repos$,repoNodes$,repoNodeOutEdges$,analysisMods$),
  map(([id,repos,repoNodes,repoNodeOutEdges,mods])=>{
    let repoid=id+'_1';
    while(repos[repoid]){ repoid+='_1'; }
    const re = new RegExp(id,'g');
    const sRepo=(str)=>str.replace(re,repoid);
    const transformRepo = (acc,v,k)=>{ acc[k]=v; if(k===id){acc[repoid]={...v,id:repoid,repoid}}};
    const transformMods = transformRepo;
    const transformNode = (acc,v,k)=>{
      acc[k]=v;
      if (v.repoid===id) {
        const fid = sRepo(k);
        acc[fid]={...v,id:fid,repoid};
        if(v.edges){acc[fid].edges=v.edges.map(sRepo);}
      };
    };
    assignToStateX({
      repos:ro(transformRepo)(repos),
      repoNodes:ro(transformNode)(repoNodes),
      analysisMods:ro(transformMods)(mods),
      repoNodeOutEdges:ro(transformNode)(repoNodeOutEdges),
    });
  })
);

export const to_repo_remove = getHandler(
  sampleCombine(repos$,repoNodes$,repoNodeOutEdges$,analysisMods$),
  map(([id,repos,repoNodes,repoNodeOutEdges,mods])=>{
    assignToStateX({
      repos:omitv(matches({id}))(repos),
      repoNodes:omitv(matches({repoid:id}))(repoNodes),
      analysisMods:omitv(matches({id}))(mods),
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
