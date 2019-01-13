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
