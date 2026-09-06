const lin=c=>{c/=255;return c<=.03928?c/12.92:((c+.055)/1.055)**2.4};
const Lum=([r,g,b])=>.2126*lin(r)+.7152*lin(g)+.0722*lin(b);
const R=(a,b)=>{const x=Lum(a),y=Lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const hex=([r,g,b])=>'#'+[r,g,b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const hsl2rgb=(h,s,l)=>{h/=360;s/=100;l/=100;
  const f=n=>{const k=(n+h*12)%12,a=s*Math.min(l,1-l);
    return 255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))};return [f(0),f(8),f(4)]};
const SCURO=[5,7,11], CARTA=[247,248,250], BIANCO=[255,255,255];
function cerca(h,s,bers,fondo,chiaro){
  const ch=!!chiaro;                    /* era un 1/0 confrontato con === a un booleano */
  let lo=ch?8:1, hi=ch?97:72, best=null;
  for(let i=0;i<44;i++){const m=(lo+hi)/2,c=hsl2rgb(h,s,m);best=c;
    if((R(c,fondo)>bers)===ch) hi=m; else lo=m;} return best}

const RUOLI=[['em',6.40,SCURO,1],['em-bright',9.00,SCURO,1],['em-light',11.00,SCURO,1],
  ['em-deep',3.60,SCURO,1],['em-c',5.67,CARTA,0],['em-c-bright',6.86,CARTA,0],
  ['em-c-deep',8.33,CARTA,0],['em-banda',4.95,BIANCO,0]];

const SCELTE=[
  ['smeraldo','Smeraldo',158,82],
  ['lime','Lime',              82,78],
  ['ambra','Ambra',            36,88],
  ['corallo','Corallo',        12,80],
  ['magenta','Magenta',       322,76],
  ['indaco','Indaco',         248,74],
  ['ciano','Ciano',           188,84],
];
const out={};
for (const [id,nome,h,s] of SCELTE){
  const v={};
  for (const [r,b,f,c] of RUOLI) v[r]=hex(cerca(h,s,b,f,c));
  v['em-vivo']=hex(hsl2rgb(h,s,42));          /* il tono pieno, per la decorazione */
  v['em-dim']=`rgba(${hsl2rgb(h,s,42).map(Math.round).join(',')},.14)`;
  v['em-c-dim']=`rgba(${rgb(v['em-c']).join(',')},.10)`;
  out[id]={nome,h,...v};
}
/* lo smeraldo resta ESATTAMENTE quello che il sito ha gia': non tocco il default */
Object.assign(out.smeraldo,{
  'em':'#14c08a','em-bright':'#4fe3b0','em-light':'#7fe3bd','em-deep':'#0a8f63',
  'em-dim':'rgba(20,192,138,.14)','em-vivo':'#14c08a',
  'em-c':'#06714f','em-c-bright':'#056347','em-c-deep':'#04553d',
  'em-c-dim':'rgba(6,113,79,.10)','em-banda':'#08805a'});

console.log('── verifica finale, ruolo per ruolo ──');
const prove=[['em',SCURO,4.5],['em-bright',SCURO,4.5],['em-c',CARTA,4.5],
  ['em-c-bright',CARTA,4.5],['em-banda',BIANCO,4.5]];
let tutteOk=true;
for (const [id,v] of Object.entries(out)){
  const righe=prove.map(([r,f,min])=>{
    const q=R(rgb(v[r]),f); if(q<min) tutteOk=false;
    return `${r}=${q.toFixed(2)}${q<min?'✗':''}`;});
  console.log(`  ${v.nome.padEnd(9)} ${v['em-vivo']}  ${righe.join('  ')}`);
}
console.log(tutteOk?'\n✓ tutte le palette passano 4,5:1 in ogni ruolo di testo'
                   :'\n✗ qualcosa non passa');
import fs from 'fs';
fs.writeFileSync('audit/palette-finale.json', JSON.stringify(out,null,1));
console.log('scritto audit/palette-finale.json');
