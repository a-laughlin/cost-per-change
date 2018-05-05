/* eslint-disable no-unused-vars */
import React from 'react';
// import logo from './logo.svg';
import logo from './cost-per-change.png';
import './App.css';
import {composeWalker,extension,demoData} from './composeWalker'
import {
  pipe,compose,assignPropsToArrays,pick,plog,omit,filter,spread,ensureArray,
  identity,uniqueId,
  has,hasIn,concat,concatRight,concatBefore,appendToCopy,concatAfter,keyIs,sort,get,constant,
  without,forkJoin,each,forOwn,pickBy,transform,omitBy,matches,transformToObj,mapv,mapk,tran,cycle,
  fltrv, fltrk,mapkToObjk, mapvToObjk, mapvToObjv, mapvToArr, mapkToArr,values,condNoExec as condnx,
  is,ifElse,cond,isArray,stubTrue,isFunction,ensureFunction,stubNull,tranToArr,and,converge, omitv, assignAll,
  fltrMapvToArr,pipeAllArgs,stubObject,isUndefined,not,stubFalse,round,debounce,memoizeFor,memoize,sortBy,keyBy,
  isPlainObject,isString,kebabCase,pipeAsync,size,fltrvToArr,pipeAllArgsAsync,isNumber,ifError,logAndThrow
} from './utils.js';


import {
  mapProps as rcMap,withProps,shouldUpdate as rcShouldUpdate,setObservableConfig,
  componentFromStream,createEventHandler,
} from 'recompose';
import { analyse,demoState,transpile } from './code-analysis'
import {asyncRepoUrlToGraph,getExampleRepo} from './api'
import * as d3 from 'd3';
import {schemeReds,scaleOrdinal,interpolateReds} from 'd3-scale-chromatic';

import {
  G,Path,Circle,Text,Div,Span,Img,H1,Ul,Li,Input,A,Label,Svg,TextInput,Button,Textarea,Header,Pre,P,
  withItemsHOCFactory,handlerPipeHOCFactory,toItemProps,
  pipeClicks,pipeChanges,pipeMouseEnter,pipeMouseLeave,polyGet,
  withGlobalState, mergeStateProps, mergeState, clearState, toState, unsetState,assignToState,
  toStateWith, statePropKey, statePublishKey,hoCond,toPropFn
} from './hoc-utils.js';

// plus a few shorthands for lists vertical, horizontal, and grid HOCs
import {v,h,g,vi,hi,gi,withStyles} from './styles.js';

import {
  ABOUT_HELP,REPO_URL_HELP,TIME_PER_CHANGE_HELP,CYCLOMATIC_HELP, MAINTAINABILITY_HELP,EFFORT_HELP
} from './help-messages.js';

// streams (there are a number of cases in the code where these separate concerns better)
// import xstreamConfig from 'recompose/xstreamObservableConfig';
// setObservableConfig(xstreamConfig);
// event.merge(store).merge(sideload).merge(props).dostuff().to(store$).publish()
// const isClickedProducer$ = Producer();
// map(merge(props$,isClicked$,store$)));
// streamClicks(merge(event$,props$,state$),dostuff,to$(isClickedProducer$,state$)))) // publishes an observable to store
// event.merge(storeInfo).select(storeSlice).map(toNextSlice).merge(storeInfo).publish()






// get our withItems factory, and use it to make sure all children can access state
const withItems = withItemsHOCFactory({mapAllChildrenProps:pick([statePropKey,statePublishKey])});
// from basically means fromParent (see itemsToElements in hoc-utils)
// for consistency, the handler pipes (e.g., pipeClicks) pass props twice so from works
const from = args=>(_,parentProps)=>polyGet(args)(mergeStateProps(parentProps))
const mapFrom = selector=>rcMap(p=>({...from(selector)(p,p),...pick([statePropKey,statePublishKey])(p)}));
const mapColl = collsFns=>(data,props)=>mapv((f,ckey)=>f(props)(from(ckey)(data,props)))(collsFns);
const shouldUpdate = fn=>rcShouldUpdate((p,n)=>fn({...p,...p[statePropKey]},{...n,...n[statePropKey]}));
const mapIdsToItemProps = (...Components)=>mapvToArr(pipe(polyGet(['id']),({id})=>({id}),toItemProps(...Components)));
const toDataProp = x=>({data:x});
const passIdTo = (...Components)=>pipe(from(['id']),toItemProps(...Components));


// Reds Scale Generator
const reds = schemeReds[8].slice(0,5);
const getRedGenerator = (min,max)=>d3.scaleQuantize().domain([min, max]).range(reds);
const scaleRed = getRedGenerator(0,4);
// const continuousReds = d3.scaleSequential(interpolateReds);
// const discreteReds = d3.scaleOrdinal(schemeReds[5])
// could make this more intuitive, comparing across domains, if the numbers were fixed... but... insufficient time.



// Modal
const modalComponents={};
const Modal = Div(
  withItems(pipe(
    from('helpMessages.0'),
    ifElse(isUndefined,()=>stubNull,({msgKey})=>Div(
      withItems(modalComponents[msgKey]||`No Help Message with key "${msgKey}".`),
      withStyles(`posF,top80px,p.5,dB,wAuto,minw3,minh3,bgcF,z1000,b1px,bcC,bSolid,brad10px,crD`,{boxShadow:'0px 0px 205px 7px #777'})
    ))
  )),
  h('posF,left0px,top-1000px,w100%,h100%,lJCC,lAIC'),hi
);
const withModal = (msgKey,MsgComponent) => {
  modalComponents[msgKey]||(modalComponents[msgKey]=isString(MsgComponent)?Span(withItems(MsgComponent)):MsgComponent);
  return compose(
    pipeClicks(({target})=>({msgKey,id:'0'}), toState('helpMessages.0')),
    v('crP')
  );
}



// Random Util Element
const QMark = Span(withItems('?'),
  h('lAIC,lACC,crP,peN,dIF,usN','tvaM,t.4,lh1.3,tcC',
  'p0,pl.3,pr.3','b1x,bSolid,brad50%,bcC','ml.5,mr.5'),
);




// User / Info Section
const TokenTextInput = TextInput(
  mapFrom({defaultValue:'userTokens.0.value'}),
  pipeChanges(from('target.value'),toState('userTokens.0.value')),
  h('w40,b0,bb1x,bcD')
);
const TokenTextContainer = Div(withItems(passIdTo(TokenTextInput)),h('lGrow1'));
const TokenHelpLink = A(
  withProps({target:'blank',href:'https://github.com/settings/tokens'}),
  withItems('github.com/settings/tokens')
);
const TokenHelpMsg = Span(withItems('Get Token at: ',TokenHelpLink,` (sorry that clicking links in the modal doesn't work yet)`));
const TokenHelp = Span(withItems(QMark),withModal('token-help',TokenHelpMsg));
const ruleLink = 'https://github.com/escomplex/escomplex/blob/master/METRICS.md';
const AboutModal = P(withItems(ABOUT_HELP), v('w100%,wsPL,peN'));
const About = Span(withItems('About'),withModal('about', AboutModal));
const TokenArea = Div(shouldUpdate(stubFalse),
  withItems(Label(withItems('GitHub Token')),TokenHelp,TokenTextContainer,About),
  h('w100%'),hi('nth3mrAuto,first:ml.5,last:mr.5'),
);




// Repo Header
const RepoUrlInput = TextInput(
  mapFrom({defaultValue:'repos[id].url',id:'id'}),
  // big friggin pipe.  Could split up.  No need yet.
  pipeChanges(
    converge([ // needs debouncing
      mapColl({// remove the current url's nodes
        repoNodes:compose(omitv,matches,polyGet({repoid:'id'})),
        repoNodeOutEdges:compose(omitv,matches,polyGet({repoid:'id'})),
      }),
      pipeAllArgsAsync( // get new nodes, set new nodes + new url
        from({url:'target.value',id:'id',token:'userTokens.0.value'}),
        plog(`allArgsAsync`),
        asyncRepoUrlToGraph, // get new repoNodes and repoNodeOutEdges for this repo
        converge({
          repoNodes:get('repoNodes'),
          repoNodeOutEdges:get('repoNodeOutEdges'),
          repos:from('repos'),
          url:from('target.value'),
          id:from('id')
        }),
        ({repos,repoNodes,repoNodeOutEdges,id,url})=>{
          // HACKY SECTION - need to recalc values on change instead of storing derived
          // need reselect or observables for that
          const repo = {...repos[id],url,costPerChangeMax:0,costPerChangeMin:Infinity}; // add url
          let maxKey,minKey;
          return {
            repos:{...repos,[id]:repo},
            repoNodeOutEdges,
            repoNodes:mapv(node=>{
              if(!node.code||node.hasOwnProperty('costPerChange')){return node;}
              const {analysis,code} = analyse(node.path,node.code);
              const n = {...node,code};
              console.log(`analysis ${n.id}`, analysis);
              mapv((v,k)=>{
                if(!isNumber(v)){return;}
                minKey = `${k}Min`;
                maxKey = `${k}Max`;
                 // storing these values since recalculating on large repos will be expensive.
                 // observables/selectors will make this a lot simpler, combine streams
                 // rather than only calculate on retrieving new nodes
                if(!repo.hasOwnProperty(minKey)){repo[minKey]=v;}
                if(!repo.hasOwnProperty(maxKey)){repo[maxKey]=v;}
                if(repo[minKey]>v){repo[minKey]=v;}
                if(repo[maxKey]<v){repo[maxKey]=v;}
                n[k]=v;
              })(analysis);
              // this might go negative if maintainability really sucks
              n.costPerChange = (171-n.maintainability)/1000*repo.devcost*repo.changetime;
              n.userImpact = n.cyclomatic;//+analysis.params.length/analysis.functions.length
              if(repo.costPerChangeMin>n.costPerChange){repo.costPerChangeMin=n.costPerChange;}
              if(repo.costPerChangeMax<n.costPerChange){repo.costPerChangeMax=n.costPerChange;}
              return n;
            })(repoNodes)
          };
        },
        plog(`after converge`),
      ),
    ]),
    Promise.all.bind(Promise),
    assignPropsToArrays,
    mapv(assignAll),
    assignToState, // requires pipeAllArgs to get the publish key... can fix with observables and store publish fn.
  ),
  h('t1em,w100%,b0,bb1x')
);

const RepoUrlHelpText = Span(withItems(REPO_URL_HELP),v('wsPL'));
const RepoUrlHelpTrigger = Span(withItems(QMark),withModal(`repo-url-help`,RepoUrlHelpText));
const RepoUrlContainer = Div(withItems(passIdTo(RepoUrlInput)),h('lGrow1'));
const RemRepoButton = Button(withItems('Remove'),
  pipeClicks(
    mapColl({
      repos:compose(omitv,matches,polyGet({id:'id'})),
      repoNodes:compose(omitv,matches,polyGet({repoid:'id'})),
      repoNodeOutEdges:compose(omitv,matches,polyGet({repoid:'id'})),
    }),
    assignToState
  ),
);
const CopyRepoButton = Button(withItems('Copy'),
  pipeClicks(
    from(({repos,repoNodes,repoNodeOutEdges,id})=>{
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
      return {
        repos:transformToObj(transformRepo)(repos),
        repoNodes:transformToObj(transformNode)(repoNodes),
        repoNodeOutEdges:transformToObj(transformNode)(repoNodeOutEdges),
      };
    }),
    assignToState,
  )
);
const RepoHeader = Div(
  withItems(
    Label(withItems('GitHub Path')),
    RepoUrlHelpTrigger,
    passIdTo(RepoUrlContainer,RemRepoButton,CopyRepoButton)
  ),
  h('w100%,b0,bt1x,bSolid,bcD,brad10x'),hi('ml.5,mr.5,mt.5')
);




// Repo File Tree

const TreeComponent = (props)=>{
  const {node,parentNode,id,getPath,getColor,[statePublishKey]:pub} = props;
  // lots of hackiness here to pass the state publish key prop
  const Circ = Circle(
    withProps(({style={}})=>({
      // [statePublishKey]:pub,
      r:4,style:{...style,fill:getColor(node),stroke:'#ccc',strokeWidth:'1px'}})),
    withModal(id,Pre(withItems(node.data.name))),
  );
  return (
  <g key={id}>
    <path
      d={getPath(parentNode,node)}
      style={{ fill: 'none', stroke: '#ccc', strokeWidth:'1px' }}>
    </path>
    {ensureArray(node.children).map((c,i)=>(
      <TreeComponent {...props} parentNode={node} node={c} id={`${id}.${i}`} key={`${id}.${i}`} />
    ))}
    <g transform={`translate(${node.y},${node.x})`}>
      <Circ/>
      <text dy={'0.35em'} x={-6} textAnchor={'end'} style={{pointerEvents:'none',userSelect:'none',font:'8px sans-serif'}}>{node.data.name}</text>
    </g>
  </g>
)}
const TreeSVG = Svg(
  withItems(pipe(
    from(({repoNodeOutEdges,repoNodes,id,repos,[statePublishKey]:pub})=>{

      repoNodes = fltrv(matches({repoid:id}))(repoNodes);
      const rootNodes = {...repoNodes};
      const adjList = mapv((outEdgeObj,nodeKey)=>outEdgeObj.edges.map((edgeKey)=>{
        delete rootNodes[edgeKey];
        return repoNodes[edgeKey];
      }))(repoNodeOutEdges);


      // map nodes to tree object with parent, children, height, depth properties
      const treeObj = d3.hierarchy(Object.values(rootNodes)[0]||{},n=>adjList[n.id]);

      const width=290;
      const height=290;
      const treeLayout = d3.tree().size([height,width])(treeObj) // Set size. Assigns x,y positions
      treeLayout.x=(height-0.1*height)/2;
      treeLayout.y=0.1*height;
      const pathGen = d3.linkHorizontal();
      const getPath = (parent,node)=>pathGen({source:[node.y,node.x],target:[parent.y,parent.x]});
      const getColor = pipe(
        get('data.costPerChange'),
        ifElse(isUndefined,()=>'#fff',getRedGenerator(repos[id].costPerChangeMin,repos[id].costPerChangeMax))
      );
      return {node:treeLayout,parentNode:treeLayout,id,getPath,getColor,[statePublishKey]:pub};
    }),
    toItemProps(TreeComponent)
  )),
  h('minw300px,minh300px')
);




// Rules
// const ChangeCostRuleHelp = Span(withItems(QMark),withModal(`change-cost-help`));
// const ChangeCostRule = Span(withItems('ChangeCost',ChangeCostRuleHelp),h,hi);
const CyclomaticHelpText = Span(withItems(CYCLOMATIC_HELP),v('wsPL'));
const CyclomaticRuleHelpTrigger = Span(withItems(QMark),withModal(`cyclomatic-help`,CyclomaticHelpText));
const CyclomaticRule = Span(withItems('Cyclomatic',CyclomaticRuleHelpTrigger),h,hi);
const EffortHelpText = Span(withItems(EFFORT_HELP),v('wsPL'));
const EffortRuleHelpTrigger = Span(withItems(QMark),withModal(`effort-help`,EffortHelpText));
const EffortRule = Span(withItems('Effort',EffortRuleHelpTrigger),h,hi);
const LocRuleHelpTrigger = Span(withItems(QMark),withModal(`loc-help`));
const LocRule = Span(withItems('Loc',LocRuleHelpTrigger),h,hi);
const MaintainabilityHelpText = Span(withItems(MAINTAINABILITY_HELP),v('wsPL'));
const MaintainabilityRuleHelpTrigger = Span(withItems(QMark),withModal(`maint-help`,MaintainabilityHelpText));
const MaintainabilityRule = Span(withItems('Maintainability',MaintainabilityRuleHelpTrigger),h,hi);
const ParamsRuleHelpTrigger = Span(withItems(QMark),withModal(`params-help`));
const ParamsRule = Span(withItems('Params',ParamsRuleHelpTrigger),h,hi);
const Rules = Div(
  withItems('Rules',MaintainabilityRule,EffortRule,CyclomaticRule/*,ParamsRule,LocRule*/),
  v,vi('t0.8,mt0.5',
  `nth1bgc${reds[4]},nth2bgc${reds[3]},nth3bgc${reds[2]},nth4bgc${reds[1]},nth5bgc${reds[0]}`)
);




// Metrics Grid Header Row
const RulesImpactText = Span(withItems(`How do this file's rules compare against repo max?`),v('wsPL'));
const RulesImpactHelpTrigger = Span(withItems(QMark),withModal(`rules-impact-help`,RulesImpactText));
const RulesImpact = Span(withItems('Rules Impact',RulesImpactHelpTrigger),h);
const CostPerChangeText = Span(withItems(`(171-maintainability)/1000*devcost*changetime`),v('wsPL'));
const CostPerChangeHelpTrigger = Span(withItems(QMark),withModal(`cost-per-change-help`,CostPerChangeText));
const CostPerChange = Span(withItems('Cost per Change',CostPerChangeHelpTrigger),h);
const UserImpactText = Span(withItems(`Just cyclomatic complexity for now.`),v('wsPL'));
const UserImpactHelpTrigger = Span(withItems(QMark),withModal(`user-impact-help`,UserImpactText));
const UserImpact = Span(withItems('User Impact',UserImpactHelpTrigger),h);
const PathHeader = Span(withItems('Path'));


// Metrics Grid Cells
const GridCellRoundNum = Span(withItems(pipe(from('data'),round)));
const GridCellPath = Span(withItems(pipe(from('repoNodes[id].path'),v=>v.replace(/^.+\//g,''))));
const RulesImpactCell = Div(
  withItems(from(({repoNodes,repos,id})=>{
    const node = repoNodes[id];
    const repo = repos[node.repoid];
    const styles = /*sortBy('width')*/([// should generate these based on selected rules, but select/deselect nodes isn't implemented yet
      {backgroundColor:reds[4],width:(node.maintainability/repo.maintainabilityMax)*100},
      {backgroundColor:reds[3],width:(node.effort/repo.effortMax)*100},
      {backgroundColor:reds[2],width:(node.cyclomatic/repo.cyclomaticMax)*100},
      // {backgroundColor:reds[1],width:(node.params/repo.paramsMax)*100},
      // {backgroundColor:reds[0],width:(node.loc/repo.locMax)*100},
    ]);
    return styles.map((s,i,c)=>{
      const lastWidth = i===0 ? 0: c[i-1].width;
      return Div(withProps({style:{...s,height:`${1/styles.length}em`,width:`${s.width}%`}}));
    });
  })),
  // h,hi
);
const MetricsBody = Div(
  withItems(
    PathHeader,
    RulesImpact,
    CostPerChange,
    UserImpact,
    pipe(
      from(({id,repoNodes})=>fltrvToArr(and(matches({repoid:id}),has('code')))(repoNodes)),
      sortBy('costPerChange'),
      a=>a.reverse(),
      a=>a.slice(0,10),
      mapv(converge([
        pipe(pick(['id']),toItemProps(GridCellPath)),
        pipe(pick(['id']),toItemProps(RulesImpactCell)),
        pipe(get('costPerChange'),toDataProp,toItemProps(GridCellRoundNum)),
        pipe(get('userImpact'),toDataProp,toItemProps(GridCellRoundNum)),
      ]))
    )
  ),
  g('minw400px,w100%,lAIC'),
  gi('mb.3,nthn-+4mb1','nthn4-3w19%_mr1%,nthn4-2w44%_mr1%,nthn4-1w19%_mr1%,nthn4w14%_mr1%')
);




// Dev Cost and Time Per Change Adjustments
const TimePerChangeText = Span(withItems(TIME_PER_CHANGE_HELP),v('wsPL'));
const TimePerChangeHelp = Span(withItems(QMark),withModal('time-per-change-help',TimePerChangeText));
const TimePerChangeLabel = Label(withItems('Time Per Change'),h('t0.8'));
const TimePerChange = TextInput(
  mapFrom({defaultValue:'repos[id].changetime',repoid:'id'}),
  pipeChanges(from('target.value'),toState('repos[repoid].changetime')),
  h('w3')
);

const DevCostPerHourText = Span(withItems(`Developer Hourly Rate, to calculate cost per change.`),v('wsPL'));
const DevCostPerHourHelp = Span(withItems(QMark),withModal(`developers-hourly-rate`,DevCostPerHourText));
const DevCostPerHourLabel = Label(withItems('Dev Hourly Cost'),h('t0.8'));
const DevCostPerHour = TextInput(
  mapFrom({defaultValue:'repos[id].devcost',repoid:'id'}),
  pipeChanges(from('target.value'),toState('repos[repoid].devcost')),
  h('w3')
);
const MetricsParams = Div(withItems(pipe(from(['id']),toItemProps(
  TimePerChangeLabel, TimePerChangeHelp, TimePerChange,
  DevCostPerHourLabel, DevCostPerHourHelp, DevCostPerHour,
))),h('mtAuto'),hi('ml.5'));

const FileMetrics = Div(
  withItems(passIdTo(MetricsBody,MetricsParams)),
  v,vi('mb.5')
);

const RepoMetrics = Div(withItems('TODO'));

const Repo = Div(
  shouldUpdate((p,n)=>p.repos[p.id].url !== n.repos[n.id].url),
  withItems(passIdTo(TreeSVG,Rules,FileMetrics)),
  h('lAIStretch'),hi('nth1mr1,nth2mr1')
);
const RepoList = Div(withItems(pipe(from('repos'),mapIdsToItemProps(RepoHeader,Repo))),v,vi('mb.5'));


// Header
const AppLogo = Img(shouldUpdate(stubFalse),withProps({ src:logo, alt:'Cost Per Change Logo'}));
const AppHeader = Header(shouldUpdate(stubFalse),withItems(AppLogo), h('lAIC,lJCC,bgF,w100%'), hi('h80x') );









// state format
// const globalStateHOC = withGlobalState({initialState:{
//   userTokens:{
//     '0':{id:'0',value:'49c740018d76ccec3621177873e29905dc427e7b'}
//   },// value:'<token here>', },
//   repos:{
//     'repo0':{id:'repo0', repoid:'repo0', url:`https://github.com/a-laughlin/nametbd/prev-version`,'changetime':'60',devcost:'80'},
//   },
//   repoNodes:{
//     'repo0_f0':{id:'repo0_f0',repoid:'repo0',path:`/src/apps`,enabled:true,hovered:false},
//     'repo0_f1':{id:'repo0_f1',repoid:'repo0',path:`/src/apps/chrome.js`, code:'const example={foo:"bar"};',enabled:true,hovered:false},
//     'repo0_f2':{id:'repo0_f2',repoid:'repo0',path:`/src/apps/firefox.js`,code:'const example=(a,b)=>({foo:a,baz:b});',enabled:true,hovered:false},
//   },
//   repoNodeOutEdges:{
//     repo0_f0:{id:'repo0_f0',repoid:'repo0',edges:['repo0_f1','repo0_f2']},
//   },
//   helpMessages:{
//     // '0':{id:'0',msg:'hello world'},
//   },
// }});
const App = Div(
  shouldUpdate(stubFalse),
  withGlobalState({initialState:demoState}),
  withItems(Modal, AppHeader, TokenArea, RepoList),
  pipeClicks(
    from('helpMessages.0'),
    ifElse(isUndefined,stubNull,pipeAllArgs(stubObject,toState('helpMessages')))
    // ^ hack to prevent immediately closing the modal before it becomes visible
    // Since stopPropagation doesn't work with pipeClicks (streams are another way to deal with this)
  ),
  v, vi('mb1')
);
export default App
