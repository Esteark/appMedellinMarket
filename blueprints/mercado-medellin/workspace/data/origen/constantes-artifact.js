// Copia literal de las constantes del artifact original (22-oct-2026). Fuente para src/data/planes.ts.
const TIENDAS=[{id:"exito",nombre:"Éxito",color:"#F5C400"},{id:"carulla",nombre:"Carulla",color:"#0F7A3D"},
  {id:"euro",nombre:"Euro",color:"#C8102E"},{id:"minorista",nombre:"La Minorista",color:"#8B5E3C"},
  {id:"d1",nombre:"D1",color:"#D62828"},{id:"ara",nombre:"Ara",color:"#E85D04"},{id:"isimo",nombre:"Ísimo",color:"#6A4C93"},{id:"pricesmart",nombre:"PriceSmart",color:"#0060A9",nota:"Club de membresía · presentaciones grandes, precio llevado a la unidad del producto"},
  {id:"solofruver",nombre:"Solofruver",color:"#7CB342",manual:true},{id:"barrio",nombre:"Tienda/Carnicería",color:"#64748B",manual:true}];
const AUTO=TIENDAS.filter(t=>!t.manual);
const TN=Object.fromEntries(TIENDAS.map(t=>[t.id,t]));
const BASICOS=["Frutas","Verduras","Tubérculos","Granos","Panadería","Proteínas","Lácteos","Despensa","Aseo"];
const ANTOJOS=["Mecato","Bebidas","Gourmet"];
const GRUPOS=[...BASICOS,...ANTOJOS];
const scopeGroups=()=>S.view==="antojos"?ANTOJOS:BASICOS;
const GCOL={Frutas:"#F97316",Verduras:"#16A34A","Tubérculos":"#A16207",Granos:"#EAB308","Proteínas":"#DC2626","Lácteos":"#3B82F6",Despensa:"#8B5CF6",Aseo:"#06B6D4","Panadería":"#D97706",Mecato:"#EC4899",Bebidas:"#0EA5E9",Gourmet:"#7C3AED"};

const PLANES={
  semana:{nombre:"Lista base de la semana (dieta 5 personas)",items:{huevos:4,lechuga:9,pepino:5,tomate:4,cebolla:1.75,cebolla_morada:1.75,pimenton:3.5,apio:1,zanahoria:1,aguacate:4,pina:1,mango:1,cilantro:1,cebollin:1,limon:1,ajo:2,papa:3,pollo:3,res_desmechar:1,molida:1,cerdo:1,maicitos:2,pasta:5,leche:4,yogur_griego:2,frijol:2,lenteja:4}},
  mes:{nombre:"Plan del mes (dieta 5 personas)",items:{huevos:16,lechuga:36,pepino:20,tomate:16,cebolla:7,cebolla_morada:7,pimenton:14,apio:4,zanahoria:4,papa:12,cilantro:4,cebollin:4,ajo:8,limon:4,aguacate:16,pina:4,mango:4,pollo:12,res_desmechar:4,molida:4,cerdo:4,atun:4,leche:16,yogur_griego:8,parmesano:1,queso_crema:2,frijol:8,lenteja:16,garbanzo:3,pasta:20,maicitos:8,sal:2,miel:1,pasta_ajo:3,paprika:2,hierbas:3,soya:2,mayonesa:1,mostaza:1}},
  hogar:{nombre:"Mercado sugerido del mes (hogar 6 personas)",items:{huevos:20,yogur_griego:17,leche_polvo:2,leche:2,pollo:10,molida:4,cerdo:4,papa:12,pimenton:8,cebolla:6,cebolla_morada:4,tomate:12,pepino:8,cilantro:4,espinaca:4,tomate_arbol:6,uva_isabelina:4,guayaba:4,pina:4,ajo:8,aguacate:8,lechuga:12,aceite_oliva:2,arroz:2,arepa:8,soya:1,hierbas:2,paprika:1}}
};
const ESC={basico:{n:"Básico",t:1425000},medio:{n:"Medio",t:1633300},ideal:{n:"Ideal",t:1825000}};
const RUBROS=[["Carnes",400000],["Huevos",300000],["Lácteos",207000],["Verduras y frutas",476300],["Despensa",150000]];
const COLCHON=100000;
function rubroOf(P){if(!P)return null;if(P.id==="huevos")return"Huevos";if(P.grupo==="Proteínas")return"Carnes";if(P.grupo==="Lácteos")return"Lácteos";
  if(P.grupo==="Frutas"||P.grupo==="Verduras"||P.grupo==="Tubérculos")return"Verduras y frutas";if(P.grupo==="Granos"||P.grupo==="Despensa"||P.grupo==="Panadería")return"Despensa";if(ANTOJOS.includes(P.grupo))return"Antojos";return"Aseo"}
const BASE=[["Canastas de 30 huevos","4 canastas",60000],["Lechuga crespa","9 unidades",13500],["Pepino","5 kg",10000],["Tomate chonto","4 kg",14000],["Cebolla morada y blanca","3,5 kg",10500],["Pimentón","3,5 kg",14000],["Apio","1 manojo",3000],["Zanahoria","1 kg",2000],["Aguacate","4 kg",16000],["Piña","1 unidad",4000],["Mango","1 kg",3000],["Cilantro","1 manojo",2000],["Cebollín","1 manojo",2000],["Limón","10 unidades",3000],["Ajo","2 cabezas",2000],["Papa","3 kg",6000],["Pollo","3 kg",21000],["Res para desmechar","1 kg",15000],["Carne molida de res","1 kg",13000],["Cerdo (chuleta)","1 kg",9000],["Maicitos dulces","2 paquetes",4000],["Pastas 500 g","5 paquetes",7500],["Leche líquida","4 bolsas",12000],["Yogurt griego mediano (D1)","2 tarros",14000],["Frijoles 500 g","2 paquetes",6000],["Lentejas 500 g","4 paquetes",12000]];
const EXTRA=[["Queso parmesano o costeño rallado","250 g",18000],["Queso crema","2 tarros",18000],["Garbanzos 500 g","2 paquetes",10000],["Sal 1 kg","1 paquete",3000],["Miel de abeja","1 frasco",15000],["Pasta de ajo","1–2 frascos",10000],["Paprika + pimentón molido","1 paquete c/u",8000],["Hierbas finas + orégano + pimienta","1 paquete c/u",9000],["Salsa de soya","2 tarros",12000],["Mayonesa + mostaza","1 bolsa c/u",14000],["Atún en lata","4 latas",16000]];
const PROT=[["Huevo (unidad)",420],["Garbanzo 100 g",500],["Lenteja 100 g",600],["Atún (porción)",4000],["Pollo 100 g",7000],["Cerdo 100 g",9000],["Res molida 100 g",13000],["Res desmechar 100 g",15000]];
