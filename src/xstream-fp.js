
import xstream from 'xstream';
import econcat from 'xstream/extra/concat';
import efromDiagram from 'xstream/extra/fromDiagram';
import efromEvent from 'xstream/extra/fromEvent';
import etween from 'xstream/extra/tween';
import ebuffer from 'xstream/extra/buffer';
import edebounce from 'xstream/extra/debounce';
import edelay from 'xstream/extra/delay';
import edropRepeats from 'xstream/extra/dropRepeats';
import edropUntil from 'xstream/extra/dropUntil';
import eflattenConcurrently from 'xstream/extra/flattenConcurrently';
import eflattenSequentially from 'xstream/extra/flattenSequentially';
import epairwise from 'xstream/extra/pairwise';
import esampleCombine from 'xstream/extra/sampleCombine';
import esplit from 'xstream/extra/split';
import ethrottle from 'xstream/extra/throttle';

// export the base obj for factories
export const xs = xstream;

// these make life easier when working with normal pipes
export const mergeWith = (...streams)=>stream=>xs.merge(stream,...streams);
export const combineWith = (...streams)=>stream=>xs.combine(stream,...streams);



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
export const shamefullySendComplete = (...a)=>s=>s.shamefullySendComplete(...a);
export const shamefullySendError = (...a)=>s=>s.shamefullySendError(...a);
export const shamefullySendNext = (...a)=>s=>s.shamefullySendNext(...a);
export const startWith = (...a)=>s=>s.startWith(...a); // - returns MemoryStream
export const subscribe = (...a)=>s=>s.subscribe(...a);
export const take = (...a)=>s=>s.take(...a);
export const setDebugListener = ({
  next = n => console.log('debug next',n),
  error = e => console.error('debug error',e),
  complete = () => console.log('debug complete'),
}={})=>s=>{s.setDebugListener({next,error,complete});return s;};
export const addDebugListener = ({
  next = n => console.log('debug next',n),
  error = e => console.error('debug error',e),
  complete = () => console.log('debug complete'),
}={})=>s=>{s.addListener({next,error,complete});return s;};

// extras
export const concat = (...streams)=>stream=>stream.compose(econcat);
export const fromDiagram = (...streams)=>stream=>stream.compose(efromDiagram);
export const fromEvent = (...streams)=>stream=>stream.compose(efromEvent);
export const tween = (...streams)=>stream=>stream.compose(etween);
export const buffer = (...streams)=>stream=>stream.compose(ebuffer);
export const debounce = (...streams)=>stream=>stream.compose(edebounce);
export const delay = (...streams)=>stream=>stream.compose(edelay);
export const dropRepeats = (...streams)=>stream=>stream.compose(edropRepeats);
export const dropUntil = (...streams)=>stream=>stream.compose(edropUntil);
export const flattenConcurrently = (...streams)=>stream=>stream.compose(eflattenConcurrently);
export const flattenSequentially = (...streams)=>stream=>stream.compose(eflattenSequentially);
export const pairwise = (...streams)=>stream=>stream.compose(epairwise);
export const sampleCombine = (...streams)=>stream=>stream.compose(esampleCombine);
export const split = (...streams)=>stream=>stream.compose(esplit);
export const throttle = (...streams)=>stream=>stream.compose(ethrottle);
