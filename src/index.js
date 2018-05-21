import React,{createElement} from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './lib/registerServiceWorker';

/* eslint-disable no-unused-vars */
import * as d3 from 'd3';
import {withProps,mapProps} from 'recompose';
import {schemeReds,scaleOrdinal,interpolateReds} from 'd3-scale-chromatic';

import logo from './static/cost-per-change.png';
import './static/index.css';
import {pipe,compose,plog,ensureArray, mx, ma, get, ifElse,cond,stubNull,isUndefined,round,sortBy,
  fa, pget,reverse,slice,is,len,condNoExec as nxcond,matches,stubTrue,flatten,argsToArray,converge,
  ifenx
} from './lib/utils.js';
import {of$,combine$,map,debug,debounce,dropRepeats,flatMap,sampleCombine} from './lib/utils$.js';
import {getModalComponent,getModalHOC} from './lib/modal.js';
// plus a few shorthands for vertical, horizontal, and grid style flexbox HOCs
import {v,h,g,vi,hi,gi,styl,stylSet,stylRemove} from './lib/styles.js';

import {repos$,to_repo_devcost$, to_repo_changetime$,
  from_target_value,repoNodes_by_repoid$,mapProp,repoNodes$,repos_id$,repoNodeOutEdges$,
  userToken$, to_userToken$,to_repo_copy,to_repo_remove,to_repo_url,repoNodeOutEdges_by_repoid$,
  repoNodes_costPerChange$,repoNodes_userImpact$,repos_by_repoNode_id$,pipeCollection,
  repoNodes_path$,nodeAnalyses$,nodeAnalyses_by_repoid$,get$,hget$
} from './dataflow.js';

import {Circle,Text,Div,Span,Img,H1,Input,A,Label,Svg,TextInput,Button,Header,Pre,P,toItemProps,
  withItemsHOCFactory, pipeClicks, pipeChanges
} from './lib/hoc-utils.js';

// data imports
import {ABOUT_HELP,REPO_URL_HELP,TIME_PER_CHANGE_HELP,CYCLOMATIC_HELP,MAINTAINABILITY_HELP,EFFORT_HELP} from './static/help-messages.js';

// things for a talk
// explain Div()
// explain each of the basic HOCs
// every element's children are a list of other elements, or a string
// show a sidebar with the definitions for each part
// only one type


// HOCs
const withModal = getModalHOC();
const withItems = withItemsHOCFactory({mapAllChildrenProps:pget(['data'])});
const clog = name=>pipe(plog(name),stubNull);
// utils
const setProp = str=>(...Components)=>pipe(({[str]:data})=>({data}),toItemProps(...Components),flatten);
export const setOwnProps = fn=>(...Components)=>pipe(fn,toItemProps(...Components),flatten);
const idx$ = (stream$,...fns)=>({data})=>stream$.map(pipe(get(data),...fns));
const idx_nodeid$ = idx$;
const idx_repoid$ = idx$;
const pass_id = setOwnProps(pget({data:'id'}));
const pass_repoid = setOwnProps(pget({data:'repoid'}));
const cpipe = (...Components)=>(...fns)=>converge(Components.map(C=>pipe(...fns)(C)));

// Reds Scale Generator
const reds = slice(0,5)(schemeReds[8]);
const getRedGenerator = (min,max)=>d3.scaleQuantize().domain([min, max]).range(reds);
const scaleRed = getRedGenerator(0,4);


// Random Util Element
const QMark = Span(withItems('?'),
  h('crP peN usN tvaM t.4 lh1.3 tcC p0 pl.3 pr.3 b1x bSolid brad50% bcC ml.5 mr.5'),
);




// User / Info Section
const TokenTextInput = TextInput(
  pipeChanges(pget({value:'target.value',data:'data'}),to_userToken$),
  // why, if I reverse these 2 hget$s, or move the style one to the parent, does the style start
  // lagging one action behind?  keeping them in this order, or setting them both on the same
  // hget$ fixes the issue. However, contextual styles control belongs to containers
  hget$({defaultValue:userToken$}),
  hget$({style:userToken$.map(ifenx(len(40),{},{border:'1px solid red'}))}),
  h('w40 b0 bb1x bcD t0.7')
);
const TokenTextContainer = Div(withItems(TokenTextInput));
const ghURL = `github.com/settings/tokens`;
const ruleLink = 'https://github.com/escomplex/escomplex/blob/master/METRICS.md';
const TokenHelpLink = A(withProps({target:'blank',href:`https://${ghURL}`}), withItems(ghURL));
const TokenHelpMsg = Span(withItems('Get Token at: ',TokenHelpLink));
const TokenHelp = Span(withItems(QMark), withModal(TokenHelpMsg));
const TokenLabel = Label(withItems('GitHub Token'));
const AboutModal = P(withItems(ABOUT_HELP), v('w100% wsPL peN'));
const About = Span(withItems('About'),withModal(AboutModal));
const TokenArea = Div(
  withItems([TokenLabel,TokenHelp,TokenTextContainer,About].map(hi('nth3mrAuto first:ml.5 last:mr.5'))),
  h('w100%')
);



// Repo Header
const RepoUrlInput = TextInput(
  hget$({defaultValue:({data:repoid})=>`repos[${repoid}].url`}),
  pipeChanges( pget({value:'target.value',data:'data'}),to_repo_url),
  h('t1em w100% b0 bb1x')
);
const RepoUrlContainer = Div(withItems(RepoUrlInput),h('lGrow1'));
const RepoUrlHelpText = Span(withItems(REPO_URL_HELP),v('wsPL'));
const RepoUrlHelpTrigger = Span(withItems(QMark),withModal(RepoUrlHelpText));
const RepoUrlLabel = Label(withItems('GitHub Path'));
const RemRepoButton = Button(withItems('Remove'), pipeClicks(get('data'),to_repo_remove),styl('t.8 lh1.1 p.2'));
const CopyRepoButton = Button(withItems('Copy'), pipeClicks(get('data'),to_repo_copy),styl('t.8 lh1.1 p.2'));
const RepoHeader = Div(
  withItems(
    cpipe(RepoUrlLabel, RepoUrlHelpTrigger, RepoUrlContainer, RemRepoButton, CopyRepoButton)(
    hi('first:ml.5 mr.5 nth2mr0 mt.5'))
  ),
  h('w100% b0 bt1x bSolid bcD brad10x')
);




// Repo File Tree
const Circ = Circle(withModal(Pre(withItems(`file click functionality not implemented yet`))));
const CircText = Text(
  withProps({dy:'0.35em',x:-6,textAnchor:'end'}), withItems(get('data')), styl('peN usN t8px')
);
const TreeComponent = ({node,parentNode,id,getPath,getColor})=>(
  <g key={id}>
    <path d={getPath(parentNode,node)} style={{fill:'none',stroke:'#ccc',strokeWidth:'1px'}}></path>
    {ensureArray(node.children).map((c,i)=>(
      <TreeComponent getPath={getPath} getColor={getColor} parentNode={node} node={c} id={`${id}.${i}`} key={`${id}.${i}`} />
    ))}
    <g transform={`translate(${node.y},${node.x})`}>
      <Circ data={node.data.id} r={4} style={{fill:getColor(node.data),stroke:'#ccc',strokeWidth:'1px'}} />
      <CircText data={node.data.name}/>
    </g>
  </g>
);

const TreeSVG = Svg(
  withItems(
    pipe(
      idx$(repos$),
      map(get(`id`)),
      dropRepeats,
      sampleCombine( repoNodeOutEdges_by_repoid$, repoNodes_by_repoid$, nodeAnalyses_by_repoid$),
      map(([repoid,eidx,nidx, aidx])=>{
        const [repoNodeOutEdges,repoNodes, analyses]=ma(get(repoid))([eidx,nidx, aidx]);
        const rootNodes = {...repoNodes};
        const adjList = mx((outEdgeObj,nodeKey)=>outEdgeObj.edges.map((edgeKey)=>{
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
        const getColor = (node)=>{
          const analysis = analyses[node.id];
          if(isUndefined(analysis)){return '#fff';}
          const {costPerChange,costPerChangeMin,costPerChangeMax} = analysis;
          return getRedGenerator(costPerChangeMin,costPerChangeMax)(costPerChange)
        };
        return toItemProps(TreeComponent)(
          {node:treeLayout,parentNode:treeLayout,id:treeLayout.data.repoid,getPath,getColor}
        );
      })
    )
  ),
  h('minw300px minh300px')
);





// Rules
const rule_styles=`t0.8 mt0.5 nth1bgc${reds[4]} nth2bgc${reds[3]} nth3bgc${reds[2]} nth4bgc${reds[1]} nth5bgc${reds[0]}`;
const CyclomaticHelpText = Span(withItems(CYCLOMATIC_HELP),v('wsPL'));
const CyclomaticRuleHelpTrigger = Span(withItems(QMark),withModal(CyclomaticHelpText));
const CyclomaticRule = Span(withItems('Cyclomatic',CyclomaticRuleHelpTrigger),h);
const EffortHelpText = Span(withItems(EFFORT_HELP),v('wsPL'));
const EffortRuleHelpTrigger = Span(withItems(QMark),withModal(EffortHelpText));
const EffortRule = Span(withItems('Effort',EffortRuleHelpTrigger),h);
const MaintainabilityHelpText = Span(withItems(MAINTAINABILITY_HELP),v('wsPL'));
const MaintainabilityRuleHelpTrigger = Span(withItems(QMark),withModal(MaintainabilityHelpText));
const MaintainabilityRule = Span(withItems('Maintainability',MaintainabilityRuleHelpTrigger),h);
const Rules = Div(withItems('Rules',cpipe(MaintainabilityRule,EffortRule,CyclomaticRule)(vi(rule_styles))),v);




// Metrics Grid Header Row
const RulesImpactText = Span(withItems(`How do this file's rules compare against repo max?`),v('wsPL'));
const RulesImpactHelpTrigger = Span(withItems(QMark),withModal(RulesImpactText));
const RulesImpact = Span(withItems('Rules Impact',RulesImpactHelpTrigger),h);
const CostPerChangeText = Span(withItems(`(171-maintainability)/1000*devcost*changetime`),v('wsPL'));
const CostPerChangeHelpTrigger = Span(withItems(QMark),withModal(CostPerChangeText));
const CostPerChange = Span(withItems('Cost per Change',CostPerChangeHelpTrigger),h);
const UserImpactText = Span(withItems(`Just cyclomatic complexity for now.`),v('wsPL'));
const UserImpactHelpTrigger = Span(withItems(QMark),withModal(UserImpactText));
const UserImpact = Span(withItems('User Impact',UserImpactHelpTrigger),h);
const PathHeader = Span(withItems('Path'));

// Metrics Grid Cells

const GridCellCostPerChange = Span(withItems(idx$(nodeAnalyses$,get(`costPerChange`),round)));
const GridCellUserImpact = Span(withItems(idx$(nodeAnalyses$,get(`userImpact`),round)));
const GridCellPath = Span(withItems(idx$(repoNodes$,get(`path`),p=>p.replace(/^.+\//g,''))));
const GridCellRulesImpact = Div(
  withItems(pipe(
    idx$(nodeAnalyses$),
    dropRepeats,
    map((node)=>{
      const styles = ([// should generate these based on selected rules, but select/deselect nodes isn't implemented yet
        {backgroundColor:reds[4],width:(node.maintainability/node.maintainabilityMax)*100},
        {backgroundColor:reds[3],width:(node.effort/node.effortMax)*100},
        {backgroundColor:reds[2],width:(node.cyclomatic/node.cyclomaticMax)*100},
      ]);
      return styles.map((s,i,c)=>{
        const lastWidth = i===0 ? 0: c[i-1].width;
        return Div(withProps({style:{...s,height:`${1/styles.length}em`,width:`${s.width}%`}}));
      });
    }),
  )),
);

const MetricsBody = Div(
  withItems(
    cpipe(PathHeader, RulesImpact, CostPerChange, UserImpact)(
      gi('mb.3 nthn-+4mb1','nthn4-3w19%_mr1% nthn4-2w44%_mr1% nthn4-1w19%_mr1% nthn4w14%_mr1%')
    ),
    pipe(
      idx$(nodeAnalyses_by_repoid$),
      dropRepeats,
      map(pipe(
        sortBy('costPerChange'),
        reverse,
        slice(0,10),
        ma(pipe(
          pass_id(GridCellPath,GridCellRulesImpact,GridCellCostPerChange,GridCellUserImpact),
          ma(gi('mb.3 nthn-+4mb1 nthn4-3w19%_mr1% nthn4-2w44%_mr1% nthn4-1w19%_mr1% nthn4w14%_mr1%'))
        ))
      ))
    )
  ),
  g('minw400px w100% lAIC'),
);



// Dev Cost and Time Per Change Adjustments
const DevCostPerHour = Input(
  hget$({defaultValue:({data:repoid})=>`repos[${repoid}].devcost`}),
  pipeChanges(from_target_value,to_repo_devcost$),
  h('w3 t0.8')
);
const dcText = Span(withItems(`Developer Hourly Rate, to calculate cost per change.`),v('wsPL'));
const dcHelp = Span(withItems(QMark),withModal(dcText));
const dcLabel = Label(withItems('Dev Hourly Cost'),h('t0.8'));

const TimePerChange = TextInput(
  hget$({defaultValue:({data:repoid})=>`repos[${repoid}].changetime`}),
  pipeChanges(from_target_value,to_repo_changetime$),
  h('w3 t0.8')
);
const tpcText = Span(withItems(TIME_PER_CHANGE_HELP),v('wsPL'));
const tpcHelp = Span(withItems(QMark),withModal(tpcText));
const tpcLabel = Label(withItems('Time Per Change'),h('t0.8'));

const MetricsParams = Div(
  withItems(cpipe(tpcLabel, tpcHelp, TimePerChange, dcLabel, dcHelp, DevCostPerHour)(hi('ml.5'))),
  h('mtAuto')
);

const FileMetrics = Div(withItems(cpipe(MetricsBody,MetricsParams)(vi('mb.5'))), v);
const Repo = Div(withItems(cpipe(TreeSVG,Rules,FileMetrics)(hi('nth1mr1 nth2mr1'))),h('lAIStretch'));
const RepoList = Div(withItems(repos$.map(ma(pipe(pass_id(RepoHeader,Repo),ma(vi('mb.5 w100%')))))),v);

// Header
const AppLogo = Img(withProps({ src:logo, alt:'Cost Per Change Logo'}));
const AppHeader = Header(withItems(hi('h80x')(AppLogo)), h('lAIC lJCC bgF w100%'));

const App = Div(withItems(cpipe(AppHeader,TokenArea,RepoList,getModalComponent())(vi('mb1 w100%'))),v);

ReactDOM.render(createElement(App), document.getElementById('root'));
registerServiceWorker();
