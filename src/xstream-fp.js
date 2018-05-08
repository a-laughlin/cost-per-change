
import xstream from 'xstream';
import concat from 'xstream/extra/concat';
import fromDiagram from 'xstream/extra/fromDiagram';
import fromEvent from 'xstream/extra/fromEvent';
import tween from 'xstream/extra/tween';
import buffer from 'xstream/extra/buffer';
import debounce from 'xstream/extra/debounce';
import delay from 'xstream/extra/delay';
import dropRepeats from 'xstream/extra/dropRepeats';
import dropUntil from 'xstream/extra/dropUntil';
import flattenConcurrently from 'xstream/extra/flattenConcurrently';
import flattenSequentially from 'xstream/extra/flattenSequentially';
import pairwise from 'xstream/extra/pairwise';
import combine from 'xstream/extra/sampleCombine';
import split from 'xstream/extra/split';
import throttle from 'xstream/extra/throttle';

// export the base obj for factories
export const xs = xstream;
// factories:

// Methods/Operators
// Methods are functions attached to a Stream instance, like stream.addListener().
// Operators are also methods, but return a new Stream, leaving the existing Stream unmodified,
// except for the fact that it has a child Stream attached as Listener. Documentation doesn't say
// which is which
// operators
export const addListener = (...a)=>s=>s.addListener(...a);
export const debug = (...a)=>s=>s.debug(...a);
export const drop = (...a)=>s=>s.drop(...a);
export const endWhen = (...a)=>s=>s.endWhen(...a);
export const filter = (...a)=>s=>s.filter(...a);
export const flatten = s=>s.flatten();
export const fold = (...a)=>s=>s.fold(...a); // - returns MemoryStream
export const imitate = (...a)=>s=>s.imitate(...a); // imitates any non-Memory Stream
export const last = (...a)=>s=>s.last(...a);
export const map = (...a)=>s=>s.map(...a);
export const mapTo = (...a)=>s=>s.mapTo(...a);
export const remember = (...a)=>s=>s.remember(...a);
export const removeListener = (...a)=>s=>s.removeListener(...a);
export const replaceError = (...a)=>s=>s.replaceError(...a);
export const setDebugListener = (...a)=>s=>s.setDebugListener(...a);
export const shamefullySendComplete = (...a)=>s=>s.shamefullySendComplete(...a);
export const shamefullySendError = (...a)=>s=>s.shamefullySendError(...a);
export const shamefullySendNext = (...a)=>s=>s.shamefullySendNext(...a);
export const startWith = (...a)=>s=>s.startWith(...a); // - returns MemoryStream
export const subscribe = (...a)=>s=>s.subscribe(...a);
export const take = (...a)=>s=>s.take(...a);

// extras
export {
  // factories
  concat,
  fromDiagram,
  fromEvent,
  tween,
  // methods/operators
  buffer,
  debounce,
  delay,
  dropRepeats,
  dropUntil,
  flattenConcurrently,
  flattenSequentially,
  pairwise,
  split,
  throttle,
};
export const sampleCombine = (stream,...streams)=>stream.compose(combine(...streams));
export const withLatestFrom = sampleCombine;
