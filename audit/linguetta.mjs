const lin=c=>{c/=255;return c<=.03928?c/12.92:((c+.055)/1.055)**2.4};
const L=h=>{const n=parseInt(h.slice(1),16);
  return .2126*lin(n>>16&255)+.7152*lin(n>>8&255)+.0722*lin(n&255)};
const R=(a,b)=>{const x=L(a),y=L(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
console.log('testo BIANCO #ffffff sopra il fondo verde della linguetta');
console.log('(serve 4,5:1 per un testo da 11px)\n');
for (const v of ['#14c08a','#12ab7b','#0f9c70','#0a8f63','#08805a','#06714f','#056347','#04553d'])
  console.log(`  fondo ${v}   ${R('#ffffff',v).toFixed(2).padStart(5)}:1   ${R('#ffffff',v)>=4.5?'✓ passa':R('#ffffff',v)>=3?'· solo testo grande':'✗ no'}`);
console.log('\nper confronto, quanto stacca la linguetta dalla carta #f7f8fa:');
for (const v of ['#14c08a','#0a8f63','#06714f','#056347'])
  console.log(`  ${v}  ${R(v,'#f7f8fa').toFixed(2)}:1`);
