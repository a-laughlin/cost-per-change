import React,{createElement} from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './lib/registerServiceWorker';

/* eslint-disable no-unused-vars */
import * as d3 from 'd3';
import {withProps} from 'recompose';
import {schemeReds,scaleOrdinal,interpolateReds} from 'd3-scale-chromatic';

import logo from './static/cost-per-change.png';
import './static/index.css';
import {pipe,compose,plog,ensureArray, mx, ma, get,cond,stubNull,isUndefined,round,sortBy,ifenx,ife,
  fa, pget,reverse,slice,is,len,matches,stubTrue,flatten,argsToArray,converge,
} from './lib/utils.js';
import {of$,combine$,map,debug,debounce,dropRepeats,flatMap,sampleCombine} from './lib/utils$.js';
import {getModalComponent,getModalHOC} from './lib/modal.js';
// plus a few shorthands for vertical, horizontal, and grid style flexbox HOCs
import {styl} from './lib/styles.js';

import {toStore,repoNodes$,to_repo_copy,to_repo_remove,to_repo_url, nodeAnalyses$,
  repoNodeOutEdges_by_repoid$, nodeAnalyses_by_repoid$,d3TreeStructure_by_repoid$,cache$,pcache$
} from './dataflow.js';

import {Circle,Text,Div,Span,Img,H1,Input,A,Label,Svg,TextInput,Button,Header,Pre,P,toItemProps,
  childrenHOCFactory, pipeClicks, pipeChanges,hget$,idxMapFactory
} from './lib/hoc-utils.js';

// data imports
import {ABOUT_HELP,REPO_URL_HELP,TIME_PER_CHANGE_HELP,CYCLOMATIC_HELP,MAINTAINABILITY_HELP,EFFORT_HELP} from './static/help-messages.js';



// HOCs
const c = childrenHOCFactory({mapAllChildrenProps:pget(['data'])});
const [v,h,g,vi,hi,gi] = ['fv','fh','fg','fvi','fhi','fgi'].map(s=>styl(s+ ' tSans'));
const withModal = getModalHOC();

// utils
const setProp = str=>(...Components)=>pipe(({[str]:data})=>({data}),toItemProps(...Components),flatten);
const setOwnProps = fn=>(...Components)=>pipe(fn,toItemProps(...Components),flatten);
const from_target_value = pget({value:'target.value',data:'data'});
const idx = idxMapFactory(); // can be replaced by pcache eventually
const pass_id = setOwnProps(pget({data:'id'}));
const pass_repoid = setOwnProps(pget({data:'repoid'}));
const cpipe = (...Components)=>(...fns)=>converge(Components.map(C=>pipe(...fns)(C)));

// Reds Scale Generator
const reds = slice(0,5)(schemeReds[8]);
const getRedGenerator = (min,max)=>d3.scaleQuantize().domain([min, max]).range(reds);
const scaleRed = getRedGenerator(0,4);


// Random Util Element
const QMark = Span(c('?'),h('crP peN usN t.4 lh1.3 tcC pl.3 pr.3 b1x bS brad50% bcC ml.5 mr.5'));


// User / Info Section
const Token_input = TextInput(
  pipeChanges(from_target_value,toStore('userTokens.0.value')),
  // why, if I reverse these 2 hget$s, or move the style one to the parent, does the style start
  // lagging one action behind?  keeping them in this order, or setting them both on the same
  // hget$ fixes the issue. However, contextual styles control belongs to containers
  hget$({defaultValue:cache$('userTokens.0.value')}),
  hget$({style:cache$('userTokens.0.value').map(ifenx(len(40),{},{border:'1px solid red'}))}),
  h('w40 b0 bb1x bcD t0.7')
);
const Token_input_wrap = Div(c(Token_input));
const ghURL = `github.com/settings/tokens`;
const ruleLink = 'https://github.com/escomplex/escomplex/blob/master/METRICS.md';
const Tokenlink = A(withProps({target:'blank',href:`https://${ghURL}`}), c(ghURL));
const Token_hlp_triggr = Span(c('Get Token at: ',Tokenlink));
const Token_hlp = Span(c(QMark), withModal(Token_hlp_triggr));
const Token_label = Label(c('GitHub Token'));
const About_modal = P(c(ABOUT_HELP), v('w100% wsPL peN'));
const About = Span(c('About'),withModal(About_modal));
const TokenArea = Div(
  c([Token_label,Token_hlp,Token_input_wrap,About].map(hi('nth3mrAuto first:ml.5 last:mr.5'))),
  h('w100%')
);



// Repo Header
const RepoUrlInput = TextInput(
  hget$({defaultValue:pcache$('repos[data].url')}),
  pipeChanges( from_target_value,to_repo_url),
  h('t1em w100% b0 bb1x')
);
const RepoUrlContainer = Div(c(RepoUrlInput),h('fGrow1'));
const RepoUrlHelpText = Span(c(REPO_URL_HELP),v('wsPL'));
const RepoUrlHelpTrigger = Span(c(QMark),withModal(RepoUrlHelpText));
const RepoUrlLabel = Label(c('GitHub Path'));
const RemRepoButton = Button(c('Remove'), pipeClicks(get('data'),to_repo_remove),styl('t.8 lh1.1 p.2'));
const CopyRepoButton = Button(c('Copy'), pipeClicks(get('data'),to_repo_copy),styl('t.8 lh1.1 p.2'));
const RepoHeader = Div(
  c([RepoUrlLabel, RepoUrlHelpTrigger, RepoUrlContainer, RemRepoButton, CopyRepoButton]
    .map(hi('first:ml.5 mr.5 nth2mr0 mt.5'))),
  h('w100% b0 bt1x bS bcD brad10x')
);




// Repo File Tree
const pathGen = d3.linkHorizontal();
const getPath = (parent,node)=>pathGen({source:[node.y,node.x],target:[parent.y,parent.x]});
const getColor = ife(isUndefined,x=>'#fff',
  ({costPerChangeMin:n,costPerChangeMax:x,costPerChange:c})=>getRedGenerator(n,x)(c));
const Circ = Circle(
  hget$(idx(nodeAnalyses$,getColor,fill=>({r:4,style:{fill,stroke:'#ccc',strokeWidth:'1px'}}))),
  withModal(Pre(c(`file click functionality not implemented yet`)))
);
const CircText = Text(withProps({dy:'0.35em',x:-6,textAnchor:'end'}), c(get('data')), styl('peN usN t8px'));
const TreeRoot = ({node,parentNode,id,analyses})=>(
  <g key={id}>
    <path d={getPath(parentNode,node)} style={{fill:'none',stroke:'#ccc',strokeWidth:'1px'}}></path>
    {ensureArray(node.children).map((c,i)=>(
      <TreeRoot parentNode={node} node={c} id={`${id}.${i}`} key={`${id}.${i}`} />
    ))}
    <g transform={`translate(${node.y},${node.x})`}>
      <Circ data={node.data.id} />
      <CircText data={node.data.name}/>
    </g>
  </g>
);

const TreeSVG = Svg(
  c(idx(d3TreeStructure_by_repoid$,(treeObj)=>{
    if(treeObj === undefined){return stubNull;} // TODO figure out why this happens
    const w=290, h=290;
    const root = Object.assign(d3.tree().size([h,w])(treeObj),{x:(h-0.1*h)/2,y:0.1*h});
    return toItemProps(TreeRoot)({node:root,parentNode:root,id:root.data.repoid});
  })),
  h('minw300px minh300px')
);


// Rules
const rule_styles=`t0.8 mt0.5 nth1bgc${reds[4]} nth2bgc${reds[3]} nth3bgc${reds[2]} nth4bgc${reds[1]} nth5bgc${reds[0]}`;
const Cyc_hlp_txt = Span(c(CYCLOMATIC_HELP),v('wsPL'));
const Cyc_hlp_trigger = Span(c(QMark),withModal(Cyc_hlp_txt));
const CyclomaticRule = Span(c('Cyclomatic',Cyc_hlp_trigger),h);
const Eff_hlptxt = Span(c(EFFORT_HELP),v('wsPL'));
const Eff_hlp_trigger = Span(c(QMark),withModal(Eff_hlptxt));
const EffortRule = Span(c('Effort',Eff_hlp_trigger),h);
const Maint_hlp_txt = Span(c(MAINTAINABILITY_HELP),v('wsPL'));
const Maint_hlp_trigger = Span(c(QMark),withModal(Maint_hlp_txt));
const MaintRule = Span(c('Maintainability',Maint_hlp_trigger),h);
const Rules = Div(c('Rules',[MaintRule,EffortRule,CyclomaticRule].map(vi(rule_styles))),v);


// Metrics Grid Header Row
const Rules_imp_txt = Span(c(`How do this file's rules compare against repo max?`),v('wsPL'));
const Rules_imp_hlp_trigger = Span(c(QMark),withModal(Rules_imp_txt));
const RulesImpact = Span(c('Rules Impact',Rules_imp_hlp_trigger),h);
const CPCtxt = Span(c(`(171-maintainability)/1000*devcost*changetime`),v('wsPL'));
const CPC_hlp_trigger = Span(c(QMark),withModal(CPCtxt));
const CostPerChange = Span(c('Cost per Change',CPC_hlp_trigger),h);
const User_imp_txt = Span(c(`Just cyclomatic complexity for now.`),v('wsPL'));
const User_imp_hlp_trigger = Span(c(QMark),withModal(User_imp_txt));
const UserImpact = Span(c('User Impact',User_imp_hlp_trigger),h);
const PathHeader = Span(c('Path'));

// Metrics Grid Cells

const Cell_cpc = Span(c(idx(nodeAnalyses$,'costPerChange',round)));
const Cell_usr_imp = Span(c(idx(nodeAnalyses$,'userImpact',round)));
const Cell_path = Span(c(idx(cache$('repoNodes'),'path',p=>p.replace(/^.+\//g,''))));
const Cell_rules_imp = Div(c(pipe(
  idx(nodeAnalyses$), dropRepeats, map((node)=>{
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
)));
const MetricsBody = Div(
  c([PathHeader, RulesImpact, CostPerChange, UserImpact]
    .map(gi('mb.3 nthn-+4mb1','nthn4-3w19%_mr1% nthn4-2w44%_mr1% nthn4-1w19%_mr1% nthn4w14%_mr1%')),
    pipe(
      idx(nodeAnalyses_by_repoid$),
      dropRepeats,
      map(pipe(
        sortBy('costPerChange'),
        reverse,
        slice(0,10),
        ma(pipe(
          pass_id(Cell_path, Cell_rules_imp, Cell_cpc, Cell_usr_imp),
          ma(gi('mb.3 nthn-+4mb1 nthn4-3w19%_mr1% nthn4-2w44%_mr1% nthn4-1w19%_mr1% nthn4w14%_mr1%'))
        ))
      ))
    )
  ),
  g('minw400px w100% fAIC'),
);


// Dev Cost and Time Per Change Adjustments
const DevCostPerHour = Input(
  hget$({defaultValue:pcache$('analysisMods[data].devcost')}),
  pipeChanges(from_target_value,plog(`analysisMods[data].devcost`),toStore('analysisMods[data].devcost')),
  h('w3 t0.8')
);
const DCtxt = Span(c(`Developer Hourly Rate, to calculate cost per change.`),v('wsPL'));
const DChelp = Span(c(QMark),withModal(DCtxt));
const DClabel = Label(c('Dev Hourly Cost'),h('t0.8'));

const TimePerChange = TextInput(
  hget$({defaultValue:pcache$('analysisMods[data].changetime')}),
  pipeChanges(from_target_value,toStore('analysisMods[data].changetime')),
  h('w3 t0.8')
);
const TPCtxt = Span(c(TIME_PER_CHANGE_HELP),v('wsPL'));
const TPChlp = Span(c(QMark),withModal(TPCtxt));
const TPClabel = Label(c('Time Per Change'),h('t0.8'));

const MetricsParams = Div(
  c(cpipe(TPClabel, TPChlp, TimePerChange, DClabel, DChelp, DevCostPerHour)(hi('ml.5'))),
  h('mtAuto')
);

const FileMetrics = Div(c(cpipe(MetricsBody,MetricsParams)(vi('mb.5'))), v);
const Repo = Div(c(cpipe(TreeSVG,Rules,FileMetrics)(hi('nth1mr1 nth2mr1'))),h('fAIStretch'));
const RepoList = Div(c(cache$('repos').map(ma(pipe(pass_id(RepoHeader,Repo),ma(vi('mb.5 w100%')))))),v);

// Header
const AppLogo = Img(withProps({ src:logo, alt:'Cost Per Change Logo'}));
const AppHeader = Header(c(hi('h80x')(AppLogo)), h('fAIC fJCC bgF w100%'));

const App = Div(c(cpipe(AppHeader,TokenArea,RepoList,getModalComponent())(vi('mb1 w100%'))),v);

ReactDOM.render(createElement(App), document.getElementById('root'));
registerServiceWorker();
