/* ── strumenti di colore ────────────────────────────────────────── */
const lin=c=>{c/=255;return c<=.03928?c/12.92:((c+.055)/1.055)**2.4};
const Lum=([r,g,b])=>.2126*lin(r)+.7152*lin(g)+.0722*lin(b);
const R=(a,b)=>{const x=Lum(a),y=Lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const hex=([r,g,b])=>'#'+[r,g,b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
const hsl2rgb=(h,s,l)=>{h/=360;s/=100;l/=100;
  const f=n=>{const k=(n+h*12)%12,a=s*Math.min(l,1-l);
    return 255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))};
  return [f(0),f(8),f(4)]};
const SCURO=[5,7,11], CARTA=[247,248,250], BIANCO=[255,255,255];

/* cerco la luminosità che centra un rapporto di contrasto dato */
function cerca(h,s,bersaglio,fondo,piuChiaro=true){
  let lo=piuChiaro?8:1, hi=piuChiaro?97:72, best=null;
  for(let i=0;i<40;i++){
    const mid=(lo+hi)/2, c=hsl2rgb(h,s,mid), r=R(c,fondo);
    best=c;
    if (Math.abs(r-bersaglio)<.01) break;
    if ((r>bersaglio)===piuChiaro) hi=mid; else lo=mid;
  }
  return best;
}

/* i quattro vincoli, presi dallo smeraldo attuale misurato */
const RUOLI = [
  ['em',        'accento su fondo scuro',        6.40, SCURO,  true ],
  ['em-bright', 'stati attivi su scuro',         9.00, SCURO,  true ],
  ['em-light',  'gradienti e contorni su scuro',11.00, SCURO,  true ],
  ['em-deep',   'superfici piene su scuro',      3.60, SCURO,  true ],
  ['em-c',      'testo verde su carta',          5.67, CARTA,  false],
  ['em-c-bright','stati attivi su carta',        6.86, CARTA,  false],
  ['em-c-deep', 'inchiostro su carta',           8.33, CARTA,  false],
  ['banda',     'fascia con scritta bianca',     4.95, BIANCO, false],
];

const CANDIDATI = [
  ['smeraldo',  158, 82, 'quello attuale'],
  ['ciano',     188, 84, 'freddo, da strumento'],
  ['indaco',    248, 74, 'il colore con cui il mondo disegna l\u2019AI'],
  ['magenta',   322, 76, 'contemporaneo, da manifesto'],
  ['ambra',      36, 88, 'caldo, editoriale \u2014 era il colore d\u2019origine'],
  ['lime',       82, 78, 'acido, il pi\u00f9 rumoroso'],
  ['corallo',    12, 80, 'cinematografico, urgente'],
  ['viola',     276, 68, 'sobrio, meno battuto'],
];

console.log('Ogni colore deve reggere otto ruoli. Se un ruolo non arriva al');
console.log('rapporto richiesto, quel colore non entra nella palette.\n');

const buone=[];
for (const [nome,h,s,nota] of CANDIDATI){
  const val={}; let peggio=99, fallito=null;
  for (const [ruolo,,bers,fondo,chiaro] of RUOLI){
    const c=cerca(h,s,bers,fondo,chiaro);
    val[ruolo]=hex(c);
    const ott=R(c,fondo), scarto=Math.abs(ott-bers)/bers;
    if (scarto>.06){ fallito=ruolo; }
    if (ott<peggio) peggio=ott;
  }
  const sat=c=>{const [r,g,b]=c.map(v=>v/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b);
    const l=(mx+mn)/2; return mx===mn?0:Math.round(100*(mx-mn)/(1-Math.abs(2*l-1)))};
  const satEm = sat(cerca(h,s,6.40,SCURO,true));
  const riga=`${nome.padEnd(9)} h${String(h).padStart(3)}  ${fallito?'✗ non regge il ruolo '+fallito:'✓'}   ${nota}   [saturazione dell'accento: ${satEm}%]`;
  console.log(riga);
  console.log('          ' + RUOLI.map(([r])=>`${r}:${val[r]}`).join('  ').replace(/(.{88})/g,'$1\n          '));
  if(!fallito) buone.push([nome,val,nota]);
}
console.log(`\n${buone.length} palette su ${CANDIDATI.length} reggono tutti gli otto ruoli.`);
import fs from 'fs';
fs.writeFileSync('audit/palette.json', JSON.stringify(buone,null,1));
