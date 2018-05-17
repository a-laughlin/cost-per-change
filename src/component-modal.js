import {createElement} from 'react';
import {createEventHandler,componentFromStreamWithConfig} from 'recompose';
import {h,withStyles as ws} from './styles';
import {pipeClicks,withItems,Div} from './hoc-utils.js';
import {stubNull,compose,pipe} from './utils.js';
import {xs,map,debounce,debug,startWith,fold} from './xstream-fp.js';
import xstreamConfig from 'recompose/xstreamObservableConfig';

// great modal styling article
// https://css-tricks.com/considerations-styling-modal/
const componentFromStream = componentFromStreamWithConfig(xstreamConfig);
const {handler,stream} = createEventHandler();

const componentStream$ = pipe(
  debounce(20),
  startWith(stubNull),
  fold((last=stubNull,next=stubNull)=>last===next?stubNull:next),
  map((C=stubNull)=>C===stubNull?stubNull:C)
)(xs.from(stream));

const modalOverlay = componentFromStream(pipe(
  p$=>componentStream$,
  map(C=>C===stubNull?null:createElement(
    Div(h(`posF top0px left0px z999 dB w100% h100%`),pipeClicks(x=>handler(C)))
  ))
));

const ModalContainer = componentFromStream(pipe(
  p$=>componentStream$,
  map(C=>C===stubNull?null:createElement(Div(
    withItems(h('w100% h100% dB')(C)),
    h(
      `posF dB left50% top80px z2000 maxw80% maxh80% p1 bgcF`,
      `b1px bcC bSolid brad10px crD oyA`,
      {transform: 'translate(-50%, 0)',boxShadow:'0px 0px 205px 7px #777'},
    )
  )))
));

const Modal = Div(withItems(ModalContainer, modalOverlay));
const withModal = Component=>compose(pipeClicks(x=>handler(Component)),ws('crP'));

export const getModalHOC = x=>withModal;
export const getModalComponent = x=>Modal;
