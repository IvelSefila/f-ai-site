const lin = c => { c/=255; return c<=.03928 ? c/12.92 : ((c+.055)/1.055)**2.4; };
const L = h => { const n=parseInt(h.slice(1),16);
  return .2126*lin(n>>16&255)+.7152*lin(n>>8&255)+.0722*lin(n&255); };
const R = (a,b) => { const x=L(a),y=L(b); return ((Math.max(x,y)+.05)/(Math.min(x,y)+.05)); };
const f = n => n.toFixed(2);

const CARTA = '#f7f8fa';           // fondo del blocco chiaro
console.log(`fondo chiaro: ${CARTA}\n`);
console.log('── verdi candidati come testo/accento su chiaro ──');
for (const v of ['#14c08a','#0f9c70','#0a8f63','#08805a','#06714f','#056347','#04553d'])
  console.log(`  ${v}  ${f(R(v,CARTA)).padStart(5)}:1   ${R(v,CARTA)>=4.5?'OK testo':R(v,CARTA)>=3?'solo titoli/grafica':'NO'}`);
console.log('\n── inchiostro e testo su chiaro ──');
for (const v of ['#05070b','#0b0f16','#2b333d','#3c4653','#4a5561','#69737f','#78838f'])
  console.log(`  ${v}  ${f(R(v,CARTA)).padStart(5)}:1   ${R(v,CARTA)>=4.5?'OK testo':R(v,CARTA)>=3?'solo grande':'NO'}`);
console.log('\n── controprova: la palette scura attuale ──');
const SCURO='#05070b';
for (const [n,v] of [['ink','#f2f4f7'],['text','#c3ccd6'],['muted','#7f8b98'],['em','#14c08a']])
  console.log(`  ${n.padEnd(6)} ${v}  ${f(R(v,SCURO)).padStart(5)}:1`);
