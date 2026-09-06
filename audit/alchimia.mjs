/* I colori dei pigmenti alchemici e medievali, con i rapporti di
   contrasto sul fondo d'inchiostro ferro-gallico. Se un pigmento non
   regge come testo, resta pigmento: si usa per il disegno, non per le
   scritte. */
const lin=c=>{c/=255;return c<=.03928?c/12.92:((c+.055)/1.055)**2.4};
const L=h=>{const n=parseInt(h.slice(1),16);
  return .2126*lin(n>>16&255)+.7152*lin(n>>8&255)+.0722*lin(n&255)};
const R=(a,b)=>{const x=L(a),y=L(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};

const NOTTE = '#140f1a';   /* inchiostro ferro-gallico, il fondo */
const PIGMENTI = [
  ['#140f1a','ferro-gallico','l’inchiostro dei manoscritti, quasi nero viola'],
  ['#241a2e','ombra','la seconda ombra'],
  ['#3d2b4f','porpora cupa','murice diluito'],
  ['#7b3f9d','porpora','murice'],
  ['#2e5f8a','lapislazzuli','oltremare, il pigmento piu caro'],
  ['#4a90c2','azzurrite','la sua parente povera'],
  ['#1f6f5c','verderame','rame ossidato'],
  ['#3fae7f','malachite','verde di rame'],
  ['#8b1a1a','sangue di drago','resina rossa'],
  ['#c8102e','cinabro','solfuro di mercurio'],
  ['#e2622f','minio','piombo rosso'],
  ['#e8a317','orpimento','solfuro d’arsenico, il giallo dei folli'],
  ['#d4af37','oro','foglia'],
  ['#e8dcc0','pergamena','la pagina'],
  ['#f6efe0','calce','il bianco'],
];
console.log('pigmento          colore    su fondo   ruolo');
for (const [hex,nome,nota] of PIGMENTI){
  const r = R(hex, NOTTE);
  const ruolo = r>=7 ? 'testo, anche piccolo' : r>=4.5 ? 'testo' : r>=3 ? 'titoli e grafica' : 'solo disegno';
  console.log(`${nome.padEnd(16)} ${hex}  ${r.toFixed(2).padStart(6)}:1  ${ruolo.padEnd(21)} ${nota}`);
}
