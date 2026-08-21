const fs = require('fs');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const output = 'loa_valores_modificados.csv';
const headers = ['UG','secretaria','unidade','funcao','subfuncao','programa','acao','natureza','Programática_LOA','secretaria','unidade','funcao','subfuncao','programa','acao','natureza','desc_sub','processo',' valor ','Peça Orçamentária','Vínculo','Tipo de despesa','INICIADO','OBS.'];
const clean = v => String(v ?? '').trim().replace(/^\.+/, '');
const num = v => Number(v) || 0;
const esc = v => { const s=String(v??''); return /[;,"\n\r]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
const code = v => clean(v).match(/^(\d+[.\d]*)/)?.[1] || clean(v);
const normalizeProgram = v => { const s=clean(v).replace(/[\u200B-\u200D\uFEFF]/g,''); return s==='0021'||s.startsWith('0021') ? '0021 - Encargos Especiais' : s.replace(/^(\d+)\s*[-—–]*\s*/,'$1 - ').replace(/\s+/g,' '); };
const actionType = a => a.startsWith('0')?'0. Operação Especial':a.startsWith('1')?'1. Projeto':a.startsWith('2')?'2. Atividade':'Outros';

(async()=>{
  const keys=['painel_loa_custom_edits','painel_loa_subelement_edits','painel_loa_added_expenses','painel_loa_removed_expenses'];
  const configs=await prisma.painelConfig.findMany({where:{chave:{in:keys}}});
  const cfg=Object.fromEntries(configs.map(x=>[x.chave,x.valor]));
  const custom=cfg.painel_loa_custom_edits||{}, edits=cfg.painel_loa_subelement_edits||{};
  const added=cfg.painel_loa_added_expenses||[], removed=new Set(cfg.painel_loa_removed_expenses||[]);
  const actionMap={};
  for(const id of [...removed,...Object.keys(edits)]) { const a=String(id).split('|')[1]||''; if(a) actionMap[code(a)]=a; }
  for(const x of added) if(x.acao) actionMap[code(x.acao)]=x.acao;
  const normalizeAction=v=>actionMap[code(v)]||clean(v).replace(/^(\d+[.\d]*)\s*[-—–]+\s*/,'$1 - ').replace(/\s+/g,' ');
  const nomMap={};
  for(const n of await prisma.nomenclaturaDespesa.findMany()) {
    nomMap[n.codigo]=n.descricao;
    nomMap[n.codigoFormatado]=n.descricao;
    const parts=n.codigoFormatado.split('.');
    if(parts.length===5) nomMap[parts.slice(0,4).join('.')]=n.descricao;
  }

  const wb=XLSX.readFile('public/loa_new.xlsx');
  const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,raw:true,defval:''});
  const map=new Map();
  for(const r of rows.slice(1)){
    const secretaria=clean(r[8]).replace(/^(\d+)\s*-\s*/,(_,c)=>`${c.padStart(2,'0')} - `);
    if(!secretaria.startsWith('11')) continue;
    const unidade=clean(r[9]), funcao=clean(r[10]), subfuncao=clean(r[11]);
    const programa=normalizeProgram(r[12]), acao=normalizeAction(r[13]);
    let natureza=clean(r[14]).replace(/\.\./g,'.').replace(/^3\.50\.39/,'3.3.50.39').replace(/^3\.90\.35/,'3.3.90.35').replace(/^4\.90\.52/,'4.4.90.52');
    const natCode=natureza.split('-')[0].trim(), official=nomMap[natCode];
    if(official) natureza=`${natCode} - ${official}`;
    const subelemento=clean(r[15]), processo=clean(r[16]), peca=clean(r[18]);
    let vinculo=clean(r[19]), aplicacao='';
    if(vinculo.includes('.')) { const p=vinculo.split('.'); vinculo=p.shift(); aplicacao=p.join('.'); }
    if(!vinculo) vinculo=natCode.split('.')[3]?`${natCode.split('.')[2]}.${natCode.split('.')[3]}`:'Tesouro / Próprio';
    const id=[secretaria,acao,natureza,vinculo,aplicacao,processo,subelemento].join('|');
    if(!map.has(id)) map.set(id,{id,ug:'11',secretaria,unidade,funcao,subfuncao,programa,acao,natureza,programatica:clean(r[7]),subelemento,processo:processo||'—',valLoa:0,fonteVinculo:vinculo,codigoAplicacao:aplicacao,tipoAcao:clean(r[20])||actionType(acao),projetoIniciado:clean(r[21]),observacao:clean(r[22]),original:r.slice(0,8)});
    if(peca==='LOA') map.get(id).valLoa+=num(r[17]);
  }

  const baseTotal=[...map.values()].reduce((s,x)=>s+num(x.valLoa),0);
  const matchedRemoved=[...map.values(),...added].filter(x=>removed.has(x.id));
  let current=[...map.values(),...added.map(x=>({...x,ug:'11'}))].filter(x=>!removed.has(x.id));
  const matchedCustom=current.filter(x=>custom[x.id]!==undefined);
  current=current.map(x=>({...x,valLoa:custom[x.id]===undefined?num(x.valLoa):num(custom[x.id]),...(edits[x.id]||{})})).filter(x=>/^11(?:\D|$)/.test(String(x.secretaria||'')));
  const lines=[headers.join(';')];
  for(const x of current){
    const o=x.original||[], link=x.codigoAplicacao?`${x.fonteVinculo}.${x.codigoAplicacao}`:x.fonteVinculo;
    lines.push([x.ug||'11',o[0]||x.secretaria,o[1]||x.unidade,o[2]||x.funcao,o[3]||x.subfuncao,o[4]||x.programa,o[5]||x.acao,o[6]||x.natureza,x.programatica||x.progKey||'',x.secretaria,x.unidade,x.funcao||'',x.subfuncao||'',x.programa,x.acao,x.natureza,x.subelemento||'',x.processo||'',num(x.valLoa),'LOA',link||'',x.tipoAcao||actionType(x.acao||''),x.projetoIniciado||'',x.observacao||''].map(esc).join(';'));
  }
  fs.writeFileSync(output,'\ufeff'+lines.join('\n')+'\n');
  const total=current.reduce((s,x)=>s+num(x.valLoa),0);
  console.log(JSON.stringify({output,registros:current.length,total:total.toFixed(2),baseTotal:baseTotal.toFixed(2),removidosConfigurados:removed.size,removidosReconhecidos:matchedRemoved.length,valorRemovido:matchedRemoved.reduce((s,x)=>s+num(x.valLoa),0).toFixed(2),adicionados:added.length,customReconhecidos:matchedCustom.length}));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>prisma.$disconnect());
