export const numf = number => {
  if(!number) return '0';
  const p1 = number.toString().slice(0, -2);
  const p2 = number % 100;
  return p2 ? p1.concat('-', p2) : p1;
};
