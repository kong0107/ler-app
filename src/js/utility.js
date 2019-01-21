export const errorHandler = (...args) =>
  console.error(...args)
;

/**
 * Rewrite Fetch API to reject non-ok responses.
 * Reject with a TypeError when a network error is encountered or CORS is misconfigured on the server side.
 * Reject with a ReferenceError if there's a response without OK status.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#Checking_that_the_fetch_was_successful }
 */
export const fetch2 = (input, init) =>
  new Promise((resolve, reject) =>
    fetch(input, init)
    .then(res => res.ok ? resolve(res) : reject(new ReferenceError(res.statusText)))
    .catch(reject)
  )
;

/**
 * @param {integer} milliseconds
 * @returns {Promise} resolves to undefined after specified milliseconds
 */
export const wait = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds))
;

export const numf = number => {
  if(!number) return '0';
  const p1 = number.toString().slice(0, -2);
  const p2 = number % 100;
  return p2 ? p1.concat('-', p2) : p1;
};

/**
 * @see {@link https://stackoverflow.com/questions/9083037/#answer-32851198 }
 * @see {@link http://blog.stevenlevithan.com/archives/javascript-roman-numeral-converter#comment-16107 }
 */
export const romanize = number => {
  const lookup = {
    M: 1000, CM: 900, D: 500, CD: 400,
    C: 100,  XC: 90,  L: 50,  XL: 40,
    X: 10,   IX: 9,   V: 5,   IV: 4,
    I: 1
  };
  let roman = '';
  for(let i in lookup) {
    while(number >= lookup[i]) {
      roman += i;
      number -= lookup[i];
    }
  }
  return roman;
};

/**
 * Create a function that checks whether a string contains a joined-keyword string
 */
export const createFilterFunction = query => {
  const yesList = [], noList = [];
  query.trim().split(/\s+/).forEach(frag => {
    if(frag === '-') return;
    if(frag.startsWith('-')) noList.push(frag.substring(1));
    else yesList.push(frag);
  });
  return text => {
    if(noList.some(frag => text.indexOf(frag) != -1)) return false;
    if(!yesList.length) return true;
    return yesList.some(frag => text.indexOf(frag) != -1);
  };
}

