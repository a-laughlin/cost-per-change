// some base styles and helpers for working with styletron
// This file is pretty nasty... huge memory requirements.
// Made for quick example.  Needs refactoring for general use.
import Styletron from 'styletron-client';
import {injectStyle} from 'styletron-utils';
import {createElement,Children,cloneElement} from 'react';
import {split,ifElse,argsToArray,transform,isPlainObject,rangeStep,identity,isString,isFunction,
  pipe,mergeAll,isProductionEnv,mapv,plog,is,omitv,union,difference,partition,ma} from './utils';
import { isComponentString, isComponent, mergeableHocFactory } from './hoc-utils'
// convert to get both val and key
/* eslint-disable no-unused-vars */


export const parseStyleString = (()=>{
  const styleMatcher = /^([a-z]+)([A-Z0-9.:#\+\-]+)(.*)$/;
  const getSizeVal = (num,unit)=>`${num}${units[unit]}`;
  const getSizeObj = (key)=>(num,unit)=>({[key]:getSizeVal(num,unit)});
  const parseColor = (num,unit)=>(
    num.length===1&&num!=='#'
      ?`#${num}${num}${num}`
      :num.length===3
        ?`#${num}`
        :`${num}${unit}`
  );
  let parser = (s,[_,prefix,num,unit]=s.match(styleMatcher))=>prefixes[prefix](num,unit);
  if(process.env.NODE_ENV !== 'production'){
    parser = s => {
      try{
        const [_,prefix,num,unit]=s.match(styleMatcher);
        return prefixes[prefix](num,unit);
      } catch(e){
        console.warn(`invalid style: "${s}"`);
        return {};
      }
    };
  }

  const styleSeparator = ' ';
  const getCachedOrParseThenCache = pipe(
    split(styleSeparator),
    omitv(is('')),
    mapv( str =>cache[str] || (cache[str]=parser(str)) ),
    mergeAll
  );
  const parseNested = str=>parseStyleString(str.replace(nestedSplitter,styleSeparator))
  const nestedSplitter = /\_/g;
  const prefixes ={
    left:getSizeObj('left'),
    right:getSizeObj('right'),
    top:getSizeObj('top'),
    bottom:getSizeObj('bottom'),
    w:getSizeObj('width'),
    h:getSizeObj('height'),
    z:(num)=>({zIndex:num}),
    minw:getSizeObj('minWidth'),
    maxw:getSizeObj('maxWidth'),
    minh:getSizeObj('minHeight'),
    maxh:getSizeObj('maxHeight'),
    m:pipe(getSizeVal,sz=>({marginTop:sz,marginRight:sz,marginBottom:sz,marginLeft:sz})),
    mt:getSizeObj('marginTop'),
    mr:getSizeObj('marginRight'),
    mb:getSizeObj('marginBottom'),
    ml:getSizeObj('marginLeft'),
    p:pipe(getSizeVal,sz=>({paddingTop:sz,paddingRight:sz,paddingBottom:sz,paddingLeft:sz})),
    pt:getSizeObj('paddingTop'),
    pr:getSizeObj('paddingRight'),
    pb:getSizeObj('paddingBottom'),
    pl:getSizeObj('paddingLeft'),
    // b:pipe(getSizeVal,sz=>({borderTop:sz,borderRight:sz,borderBottom:sz,borderLeft:sz})),
    // bt:getSizeObj('borderTop'),
    // br:getSizeObj('borderRight'),
    // bb:getSizeObj('borderBottom'),
    // bl:getSizeObj('borderLeft'),
    b:pipe(getSizeVal,sz=>({borderTopWidth:sz,borderRightWidth:sz,borderBottomWidth:sz,borderLeftWidth:sz})),
    bt:getSizeObj('borderTopWidth'),
    br:getSizeObj('borderRightWidth'),
    bb:getSizeObj('borderBottomWidth'),
    bl:getSizeObj('borderLeftWidth'),
    bc:(num,unit)=>({borderColor:parseColor(num,unit)}),
    brad:getSizeObj('borderRadius'),
    lh:getSizeObj('lineHeight'),
    t:(num,unit)=>({fontSize:getSizeVal(num,unit),lineHeight:getSizeVal((+num+0.4).toFixed(1),unit)}),
    tc:(num,unit)=>({color:parseColor(num,unit)}),//text color
    bg:(num,unit)=>({background:parseColor(num,unit)}),//text color
    bgc:(num,unit)=>({backgroundColor:parseColor(num,unit)}),//text color

    /* pseudoclasses: requires some lib (e.g., styletron) that converts styles to an actual stylesheet */
    nth:(num,unit)=>({[`:nth-child(${num})`]:parseNested(unit)}),
    // select = 6 nth6
    // select >=6 nthn1+6
    // select <=6 nthn-+6
    // select %2 nthn2
    // select odds nthn2-1
    // select every 4th,starting at 1 nthn4+1
    // select second to last (not implemented) nth-last-child(2)
    nthn:(num,unit)=>({[`:nth-child(${num[0]}n${num.slice(1)})`]:parseNested(unit)}),
    before:(num,unit)=>({':before':parseNested(unit)}),
    after:(num,unit)=>({':after':parseNested(unit)}),
    first:(num,unit)=>({':first-child':parseNested(unit)}),
    last:(num,unit)=>({':last-child':parseNested(unit)}),
    link:(num,unit)=>({':link':parseNested(unit)}),
    visited:(num,unit)=>({':visited':parseNested(unit)}),
    hover:(num,unit)=>({':hover':parseNested(unit)}),
    active:(num,unit)=>({':active':parseNested(unit)}),
    above:(num,unit)=>({[`@media (min-width: ${num-1}px)`]:parseNested(unit)}),
    below:(num,unit)=>({[`@media (max-width: ${num}px)`]:parseNested(unit)}),
  }
  const units={
    '':'em',
    em:'em',
    x:'px',
    px:'px',
    '%':'%',
  };
  const cache = {
    // lists
    fInline:{display:'inline-flex'},
    fShrink0:{flexShrink:'0'},
    fGrow1:{flexGrow:'1'},
    fAIS:{alignItems:'flex-start'},
    fACS:{alignContent:'flex-start'},
    fAIC:{alignItems:'center'},
    fAIStretch:{alignItems:'stretch'},
    fACC:{alignContent:'center'},
    fAIE:{alignItems:'flex-end'},
    fACE:{alignContent:'flex-end'},
    fJCE:{justifyContent:'flex-end'},
    fJCS:{justifyContent:'flex-start'},
    fJCStretch:{justifyContent:'stretch'},
    fJCC:{justifyContent:'center'},
    fJCSA:{justifyContent:'space-around'},
    fJCSB:{justifyContent:'space-between'},
    fJCSE:{justifyContent:'space-evenly'},

    // borders
    bS:{borderStyle:'solid'},
    bD:{borderStyle:'dashed'},
    // text
    tSerif:{fontFamily: `serif`},
    tCapital:{textTransform:'capital'},
    tUpper:{textTransform:'uppercase'},
    tLower:{textTransform:'lowercase'},
    tUnderline:{textDecoration:'underline'},
    tItalic:{textDecoration:'italic'},
    tBold:{fontWeight:'700'},
    // vertical-align
    tvaM:{verticalAlign:'middle'},
    tvaT:{verticalAlign:'top'},
    tvaB:{verticalAlign:'bottom'},
    // tSans from https://css-tricks.com/snippets/css/system-font-stack/
    tSans:{ fontFamily: `-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,`+
      `Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif`},
    // sizes
    wAuto:{width:`auto`},
    hAuto:{height:`auto`},
    mtAuto:{marginTop:`auto`},
    mrAuto:{marginRight:`auto`},
    mbAuto:{marginBottom:`auto`},
    mlAuto:{marginLeft:`auto`},
    mAuto:{marginTop:`auto`,marginRight:`auto`,marginBottom:`auto`,marginLeft:`auto`},
    mInherit:{marginTop:`inherit`,marginRight:`inherit`,marginBottom:`inherit`,marginLeft:`inherit`},
    wInherit:{width:`inherit`},
    hInherit:{height:`inherit`},
    mtInherit:{marginTop:`inherit`},
    mrInherit:{marginRight:`inherit`},
    mbInherit:{marginBottom:`inherit`},
    mlInherit:{marginLeft:`inherit`},


    // white-space
    wsN:{whiteSpace:'normal'},
    wsNW:{whiteSpace:'no-wrap'},
    wsPL:{whiteSpace:'pre-line'},
    wsP:{whiteSpace:'pre'},
    // word-break
    wbN:{wordBreak:'normal'},
    wbBA:{wordBreak:'break-all'},
    wbKA:{wordBreak:'keep-all'},
    wbBW:{wordBreak:'break-word'},
    // overflow-wrap
    owBW:{overflowWrap:'break-word'},
    owN:{overflowWrap:'normal'},
    // overflow
    oH:{overflow:'hidden'},
    oV:{overflow:'visible'},
    oS:{overflow:'scroll'},
    oA:{overflow:'auto'},
    oxH:{overflowX:'hidden'},
    oxV:{overflowX:'visible'},
    oxS:{overflowX:'scroll'},
    oxA:{overflowX:'auto'},
    oyH:{overflowY:'hidden'},
    oyV:{overflowY:'visible'},
    oyS:{overflowY:'scroll'},
    oyA:{overflowY:'auto'},
    // display
    dB:{display:'block'},
    dN:{display:'none'},
    dIF:{display:'inline-flex'},
    dI:{display:'inline'},
    // visibility
    vV:{visibility:'visible'},
    vH:{visibility:'hidden'},
    // position
    posA:{position:'absolute'},
    posR:{position:'relative'},
    posF:{position:'fixed'},
    posS:{position:'sticky'},
    posStatic:{position:'static'},
    // cursor
    crP:{cursor:'pointer'},
    crD:{cursor:'default'},
    // pointer-events
    peN:{pointerEvents:'none',touchAction:'none'},
    // user-select
    usN:{userSelect:'none'},
    usT:{userSelect:'text'},
    usC:{userSelect:'contain'},
    usA:{userSelect:'all'},

  };
  cache.tLink = {
    ...cache.tUnderline,
    ':link':cache.tUnderline,
    ':visited':cache.tUnderline,
    ':hover':cache.tUnderline,
    ':active':cache.tUnderline,
  };

  cache.fh = {
    listStyleType:'none',
    display:'flex',
    flexDirection:'row',
    alignItems:'center',
    alignContent:'flex-start',
    justifyContent:'flex-start',
    flexWrap:'nowrap',
  };
  cache.fv = {
    ...cache.fh,
    flexDirection:'column',
    alignItems:'flex-start',
  };
  cache.fg = {
    ...cache.fh,
    flexWrap:'wrap',
    alignItems:'flex-start',
    justifyContent:'space-evenly',
  };

  cache.fhi = {
    listStyleType:'none',
    flexGrow:'0',
    flexShrink:'1',
    flexBasis:'auto',
    width:'auto',
    height:'auto',
  };
  cache.fvi = {
    ...cache.fhi,
    flexShrink:'0',
  };
  cache.fgi = {
    ...cache.fhi,
  };


  return getCachedOrParseThenCache;
})();
// check cached combos, check constants,run getPrefix:getSuffix

/**
 * HELPERS
 */

// export const parseStyleString = parseStyleString;




const logStylesMessage = (type,obj,invalid={})=>{
  const invalidKeys = Object.keys(invalid).join(',');
  console.warn(`Invalid ${type} styles "${invalidKeys}" passed in:\n${JSON.stringify(obj,null,2)}`);
};
// onError = (args)=>{
//   console.log(`stylesHOCFactory Component + Styles tests failed.\nReturning first of:\n`,args);
//   return args[0];
// }

const validityTest = (listType,invalidKeysObj)=>ifElse(isProductionEnv,identity,obj=>{
  let hasInvalid = false;
  const result = transform(({valid,invalid},val,key)=>{
    (invalidKeysObj[key] ? (hasInvalid = true && invalid) : valid)[key]=val;
  },{invalid:{},valid:{}})(obj);
  if(hasInvalid){logStylesMessage(listType, obj, result.invalid)};
  return result.valid;
})

const rejectInvalidListStyles = validityTest('list',{
  width:1,height:1,
  margin:1,marginTop:1,marginBottom:1,marginLeft:1,marginRight:1,
  position:1,left:1,right:1,top:1,bottom:1,zIndex:1,
  flexBasis:1,flex:1,flexGrow:1,flexShrink:1,
  pointerEvents:1,overflow:1
});
const rejectInvalidListItemStyles = validityTest('listItems',{});

/**
 * withStyles && withItemContextStyles
 */
// move list styles out
// separate cache from parser
// inline adapter
export const onPropsPassedInline = (merged,props)=>({...props,style:{...props.style,...merged}});
export const onItemPropsPassedInline = (merged,props)=>{
  if(!props.children||props.children.length===0){return props;}
  return {...props,children:Children.map(props.children,(elem)=>(
    !elem ? null : cloneElement(elem, {...elem.props,style:{...elem.props.style,...merged}})
  ))};
};

// styletron adapter
// BUG the class merge doesn't remove classes,
// so conditional styles with a second hoc wrapping will only add more styles, not be conditional
// const classUnion = (c1,c2)=>union((c1+c2).split(' '));
// cache class names classNameToStyleObjMap
// when replacing, construct a new object from the classNamesMap
const shortcutObjCache={};
const shortcutToStyleNamesCache={};
const getStyletronConfig=()=>{
  const prefix = '_';
  const styletron = new Styletron({prefix});
  const propsMapper = fn=>obj=>props=>{
    // console.log(`obj`, obj);
    // console.log(`api.objToStyleKeys(obj)`, api.objToStyleKeys(obj));
    return pipe(
      props=>props.className||'',
      split(' '),
      partition(s=>s[0]===prefix),
      ([styleTronClasses,otherClasses])=>[
        ...otherClasses,
        ...fn(api.objToStyleKeys(obj),styleTronClasses),
      ].join(' '),
      className=>({...props,className}),
    )(props)
  };
  const api = {
    // console.log(`styletron`, styletron);
    // styletron.cache contains the current keys
    objToStyleKeys:ma((v,k)=>injectStyle(styletron,{[k]:v})),
    remove:propsMapper((newClasses,classes)=>difference(classes,newClasses)),
    merge:propsMapper((newClasses,classes)=>union(classes,newClasses)),
    set:propsMapper((newClasses,classes)=>newClasses),
    custom:fn=>propsMapper(fn)({})
  };
  api.itemPropsPassed = (merged,props)=>{
    if(!props.children||props.children.length===0){return props;}
    return {...props,children:Children.map(props.children,(elem)=>(
      !elem ? null : cloneElement(elem, {...elem.props,className:`${elem.props.className||''} ${injectStyle(merged)||''}`})
    ))};
  };
  return api;
};

const normalizeStyles = ifElse(isString,parseStyleString,identity);
let globalConfig;

const mergeInputs = pipe(argsToArray(identity),mapv(normalizeStyles),mergeAll);
const sconfig = getStyletronConfig();
export const stylBase = fn=>(...input)=>BaseComponent=>props=>createElement(BaseComponent,fn(...input)(props));
const stylCustom = stylBase(pipe(mergeInputs,sconfig.custom));
const removeStyles = pipe(mergeInputs,sconfig.remove);
// globalConfig = {propsPassed:onPropsPassedInline,itemPropsPassed:onItemPropsPassedInline};
globalConfig = sconfig;
export const styl = mergeableHocFactory({
  onArgs:mergeInputs,
  onComponent:(merged,props)=>sconfig.merge(merged)(props)
});
export const stylSet = mergeableHocFactory({
  onArgs:mergeInputs,
  onComponent:(merged,props)=>sconfig.set(merged)(props)
});
export const stylRemove = mergeableHocFactory({
  onArgs:mergeInputs,
  onComponent:(merged,props)=>sconfig.remove(merged)(props)
});
export const pstyl = (...inputs)=>sconfig.merge(mergeInputs(...inputs));;
// export const pstyl = compose(sconfig.merge,mergeInputs);
// export const withListStyles = mergeableHocFactory({
//   onArgs:pipe(mergeInputs,rejectInvalidListStyles),
//   onComponent:globalConfig.propsPassed
// });

// wireframe item shorthands
// export const [wfvi,wfhi,wfgi] = [
//   ['BLUE','lVerticalItem'],['RED','lHorizontalItem'],['DARKGREEN','lGridItem']
// ].map(([color,itmDir])=>styl(`bc${color} ${itmDir} tc333 b1x bD`));
