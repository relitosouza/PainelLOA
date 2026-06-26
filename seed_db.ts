import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BUDGET_ORGANS = [
  { code: "01.02.000.00", name: "GABINETE DO PREFEITO" },
  { code: "01.04.000.00", name: "SECRETARIA DE FINANÇAS" },
  { code: "01.05.000.00", name: "PROCURADORIA GERAL DO MUNICÍPIO" },
  { code: "01.06.000.00", name: "SECRETARIA DE ADMINISTRAÇÃO" },
  { code: "01.07.000.00", name: "SECRETARIA DE EMPREGO, TRABALHO E RENDA" },
  { code: "01.08.000.00", name: "SECRETARIA DA EDUCAÇÃO" },
  { code: "01.09.000.00", name: "SECRETARIA DA SAÚDE" },
  { code: "01.11.000.00", name: "SECRETARIA DE SERVIÇOS E OBRAS" },
  { code: "01.12.000.00", name: "SECRETARIA DE ESPORTE, RECREAÇÃO E LAZER" },
  { code: "01.13.000.00", name: "SECRETARIA DE HABITAÇÃO" },
  { code: "01.14.000.00", name: "SECRETARIA DE ASSISTÊNCIA SOCIAL" },
  { code: "01.15.000.00", name: "SECRETARIA DE CULTURA" },
  { code: "01.16.000.00", name: "SECRETARIA DE TECNOLOGIA, INOVAÇÃO E DESENVOLVIMEN" },
  { code: "01.17.000.00", name: "SECRETARIA DE MEIO AMBIENTE E RECURSOS HÍDRICOS" },
  { code: "01.18.000.00", name: "ENCARGOS GERAIS DO MUNICÍPIO" },
  { code: "01.19.000.00", name: "SECRETARIA DE TRANSPORTES E MOBILIDADE URBANA=" },
  { code: "01.20.000.00", name: "SECRETARIA DE SEGURANÇA E CONTROLE URBANO" },
  { code: "01.23.000.00", name: "SECRETARIA DE COMUNICAÇÃO" },
  { code: "01.24.000.00", name: "SECRETARIA DE PLANEJAMENTO E GESTÃO" },
  { code: "01.25.000.00", name: "SECRETARIA DE RELAÇÕES INSTITUCIONAIS" },
  { code: "01.27.000.00", name: "CONTROLADORIA GERAL DO MUNICÍPIO" },
  { code: "01.28.000.00", name: "SECRETARIA DE GOVERNO" },
  { code: "01.29.000.00", name: "SECRETARIA EXECUTIVA DA INFÂNCIA E JUVENTUDE" },
  { code: "01.30.000.00", name: "SECRETARIA EXECUTIVA DA PESSOA COM DEFICIÊNCIA" },
  { code: "01.31.000.00", name: "SECRETARIA EXECUTIVA DA PROMOÇÃO DA IGUALDADE RACI" },
  { code: "01.32.000.00", name: "SECRETARIA EXECUTIVA DE POLÍTICAS PARA MULHERES E" },
  { code: "01.33.000.00", name: "SECRETARIA EXECUTIVA DE COMPRAS E LICITAÇÕES" },
  { code: "01.34.000.00", name: "COORDENADORIA DA DEFESA CIVIL" },
  { code: "01.35.000.00", name: "SECRETARIA DA CASA CIVIL" },
  { code: "01.36.000.00", name: "SECRETARIA DA FAMÍLIA, CIDADANIA E SEGURANÇA ALIME" },
  { code: "01.99.000.00", name: "RESERVA DE CONTINGÊNCIA" },
];

const BUDGET_UNITS = [
  { code: "01.05.001.00", name: "GABINETE DA PROCURADORIA GERAL DO MUNICÍPIO" },
  { code: "01.18.001.00", name: "RECURSOS SOB SUPERVISÃO DA SECRETARIA DE FINANÇAS" },
  { code: "01.24.001.00", name: "GABINETE DA SECRETARIA DE PLANEJAMENTO E GESTÃO" },
  { code: "01.06.001.00", name: "GABINETE DA SECRETARIA DE ADMINISTRAÇÃO" },
  { code: "01.33.001.00", name: "GABINETE DA SECRETARIA EXECUTIVA DE COMPRAS E LICI" },
  { code: "01.34.001.00", name: "GABINETE DA COORDENADORIA DA DEFESA CIVIL" },
  { code: "01.30.001.00", name: "GABINETE DA SECRETARIA EXECUTIVA DA PESSOA COM DEF" },
  { code: "01.31.001.00", name: "GABINETE DA SECRETARIA EXECUTIVA DA PROMOÇÃO DA IG" },
  { code: "01.04.001.00", name: "GABINETE DA SECRETARIA DE FINANÇAS" },
  { code: "01.16.004.00", name: "SECRETARIA EXECUTIVA DE INOVAÇÃO E TECNOLOGIA" },
  { code: "01.28.001.00", name: "GABINETE DA SECRETARIA DE GOVERNO" },
  { code: "01.32.001.00", name: "GABINETE DA SECRETARIA EXECUTIVA DE POLÍTICAS PARA" },
  { code: "01.28.004.00", name: "SECRETARIA EXECUTIVA DE LICENCIAMENTO, CADASTRO IM" },
  { code: "01.24.002.00", name: "SECRETARIA EXECUTIVA DE PROJETOS E CIDADE" },
  { code: "01.16.005.00", name: "SECRETARIA EXECUTIVA DE DESENVOLVIMENTO ECONÔMICO" },
  { code: "01.27.001.00", name: "GABINETE DA CONTROLADORIA GERAL DO MUNICÍPIO" },
  { code: "01.29.001.00", name: "GABINETE DA SECRETARIA EXECUTIVA DA INFÂNCIA E JUV" },
  { code: "01.23.001.00", name: "GABINETE DA SECRETARIA DA COMUNICAÇÃO" },
  { code: "01.19.004.00", name: "DEPARTAMENTO MUNICIPAL DE TRANSPORTES" },
  { code: "01.20.001.00", name: "GABINETE DA SECRETARIA DE SEGURANÇA E CONTROLE URB" },
  { code: "01.19.001.00", name: "GABINETE DA SECRETARIA DE TRANSPORTES E DA MOBILID" },
  { code: "01.16.001.00", name: "GABINETE DA SECRETARIA DE TECNOLOGIA, INOVAÇÃO E D" },
  { code: "01.15.001.00", name: "GABINETE DA SECRETARIA DE CULTURA" },
  { code: "01.11.001.00", name: "GABINETE DA SECRETARIA DE SERVIÇOS E OBRAS" },
  { code: "01.36.002.00", name: "SECRETARIA EXECUTIVA DE SEGURANÇA ALIMENTAR E NUTR" },
  { code: "01.07.001.00", name: "GABINETE DA SECRETARIA DE EMPREGO, TRABALHO E REND" },
  { code: "01.18.002.00", name: "RECURSOS SOB SUPERVISÃO DA SECRETARIA DE ADMINISTR" },
  { code: "01.36.001.00", name: "GABINETE DA SECRETARIA DA FAMÍLIA, CIDADANIA E SEG" },
  { code: "01.12.001.00", name: "GABINETE DA SECRETARIA DE ESPORTE, LAZER E RECREAÇ" },
  { code: "01.17.001.00", name: "GABINETE DA SECRETARIA DE MEIO AMBIENTE E RECURSOS" },
  { code: "01.09.015.00", name: "DIRETORIA GERAL DA GESTÃO DE SAÚDE" },
  { code: "01.13.011.00", name: "DEPARTAMENTO DE GESTÃO ADMINISTRATIVA, FINANCEIRA" },
  { code: "01.35.001.00", name: "GABINETE DA SECRETARIA DA CASA CIVIL" },
  { code: "01.14.010.00", name: "DEPARTAMENTO DE GESTÃO ADMINISTRATIVA" },
  { code: "01.02.001.00", name: "CHEFIA DE GABINETE" },
  { code: "01.02.012.00", name: "FUNDO ESPECIAL DE MANUTENÇÃO DOS BOMBEIROS" },
  { code: "01.02.006.00", name: "FUNDO SOCIAL DE SOLIDARIEDADE" },
  { code: "01.04.003.00", name: "SUBSECRETARIA DO TESOURO MUNICIPAL" },
  { code: "01.27.003.00", name: "AUDITORIA GERAL DO MUNICÍPIO" },
  { code: "01.18.003.00", name: "RECURSOS SOB SUPERVISÃO DA SEC. DE TEC, INOV. E DE" },
  { code: "01.15.004.00", name: "DEPARTAMENTO DE DIFUSÃO CULTURAL E ARTÍSTICA" },
  { code: "01.15.005.00", name: "DEPARTAMENTO DE PATRIMÔNIO HISTÓRICO E CULTURAL" },
  { code: "01.04.002.00", name: "SUBSECRETARIA DA RECEITA MUNICIPAL" },
  { code: "01.06.011.00", name: "FUNDO MUNICIPAL DE VALORIZAÇÃO DOS SERVIDORES" },
  { code: "01.20.006.00", name: "COMANDO GERAL DA GUARDA CIVIL MUNICIPAL" },
  { code: "01.14.009.00", name: "DEPARTAMENTO DE GESTÃO DO SISTEMA ÚNICO DE ASSISTÊ" },
  { code: "01.14.001.00", name: "GABINETE DA SECRETARIA DE ASSISTÊNCIA SOCIAL" },
  { code: "01.14.007.00", name: "DEPARTAMENTO DE PROTEÇÃO SOCIAL BÁSICA" },
  { code: "01.14.005.00", name: "FUNDO MUNICIPAL DE ASSISTÊNCIA SOCIAL" },
  { code: "01.14.006.00", name: "FUNDO MUNICIPAL DO IDOSO" },
  { code: "01.14.008.00", name: "DEPARTAMENTO DE PROTEÇÃO SOCIAL ESPECIAL" },
  { code: "01.09.001.00", name: "GABINETE DA SECRETARIA DA SAÚDE" },
  { code: "01.09.010.00", name: "DIRETORIA GERAL DE URGÊNCIA E EMERGÊNCIA" },
  { code: "01.09.006.00", name: "HOSPITAL E MATERNIDADE AMADOR AGUIAR" },
  { code: "01.09.008.00", name: "DIRETORIA GERAL DE ATENÇÃO PRIMÁRIA EM SAÚDE" },
  { code: "01.09.009.00", name: "DIRETORIA GERAL DA ATENÇÃO SECUNDÁRIA EM SAÚDE" },
  { code: "01.09.014.00", name: "HOSPITAL MUNICIPAL DA CRIANÇA" },
  { code: "01.09.007.00", name: "HOSPITAL MUNICIPAL ANTÔNIO GIGLIO" },
  { code: "01.09.012.00", name: "DEPARTAMENTO DE ASSISTÊNCIA FARMACÊUTICA" },
  { code: "01.09.011.00", name: "DEPARTAMENTO DE VIGILÂNCIA EM SAÚDE" },
  { code: "01.07.002.00", name: "DEPARTAMENTO DE QUALIFICAÇÃO PROFISSIONAL" },
  { code: "01.13.001.00", name: "GABINETE DA SECRETARIA DE HABITAÇÃO" },
  { code: "01.07.003.00", name: "DEPARTAMENTO DE APOIO À INCLUSÃO DO TRABALHADOR" },
  { code: "01.07.005.00", name: "FUNDO MUNICIPAL DO TRABALHO DE OSASCO" },
  { code: "01.07.004.00", name: "DEPARTAMENTO DE ECONOMIA SOLIDÁRIA E CRIATIVA" },
  { code: "01.08.001.00", name: "GABINETE DA SECRETARIA DA EDUCAÇÃO" },
  { code: "01.08.006.00", name: "SECRETARIA EXECUTIVA DE GESTÃO ESCOLAR" },
  { code: "01.08.007.00", name: "SECRETARIA EXECUTIVA DE GESTÃO PEDAGÓGICA" },
  { code: "01.08.008.00", name: "DIRETORIA GERAL DE GESTÃO ADMINISTRATIVA E FINANCE" },
  { code: "01.15.002.00", name: "FUNDO MUNICIPAL DE APOIO À CULTURA" },
  { code: "01.31.002.00", name: "FUNDO MUNICIPAL DA PROMOÇÃO DA IGUALDADE RACIAL" },
  { code: "01.15.003.00", name: "DEPARTAMENTO DE PARCERIAS, CONTRATOS E SUPRIMENTOS" },
  { code: "01.15.006.00", name: "DEPARTAMENTO DE PROMOÇÃO DE EVENTOS" },
  { code: "01.29.002.00", name: "FUNDO MUNICIPAL DOS DIREITOS DA CRIANÇA E DO ADOLE" },
  { code: "01.27.002.00", name: "OUVIDORIA GERAL DO MUNICÍPIO" },
  { code: "01.13.008.00", name: "FUNDO MUNICIPAL DE POLÍTICA URBANA E HABITACIONAL" },
  { code: "01.28.007.00", name: "FUNDO MUNICIPAL DE POLÍTICAS SOBRE DROGAS" },
  { code: "01.11.015.00", name: "SECRETARIA EXECUTIVA DE SERVIÇOS E ZELADORIA URBAN" },
  { code: "01.11.007.00", name: "DEPTO DE OBRAS PÚBLICAS E INFRAESTRUTURA URBANA" },
  { code: "01.11.008.00", name: "FUNDO MUNICIPAL DE LIMPEZA URBANA" },
  { code: "01.11.014.00", name: "FUNDO MUNICIPAL DE MANUTENÇÃO DE VELÓRIOS" },
  { code: "01.11.017.00", name: "DIRETORIA GERAL DE ILUMINAÇÃO PÚBLICA" },
  { code: "01.11.018.00", name: "DIRETORIA GERAL DE GESTÃO DE RESÍDUOS" },
  { code: "01.11.019.00", name: "DIRETORIA GERAL DE SERVIÇOS FUNERÁRIOS" },
  { code: "01.19.005.00", name: "FUNDO MUNICIPAL DE TRÂNSITO" },
  { code: "01.13.002.00", name: "DEPTO DE PLANEJAMENTO HABITACIONAL" },
  { code: "01.13.003.00", name: "DEPARTAMENTO DE PROJETOS E OBRAS" },
  { code: "01.13.010.00", name: "DEPTO DE REGULARIZAÇÃO FUNDIÁRIA" },
  { code: "01.13.012.00", name: "DEPARTAMENTO DE TRABALHO SOCIAL" },
  { code: "01.13.013.00", name: "DEPTO DE MANUTENÇÃO E SERVIÇOS OPERACIONAIS" },
  { code: "01.17.003.00", name: "FUNDO MUNICIPAL DE MEIO AMBIENTE" },
  { code: "01.17.004.00", name: "DEPTO DE PLANJAMENTO, GESTÃO E EDUCAÇÃO AMBIENTAL" },
  { code: "01.17.007.00", name: "DEPARTAMENTO DE RECURSOS HÍDRICOS E SANEAMENTO" },
  { code: "01.17.005.00", name: "DEPTO DE MANUTENÇÃO DE PARQUES E ÁREAS VERDES" },
  { code: "01.17.002.00", name: "DEPTO DO MEIO AMBIENTE" },
  { code: "01.17.008.00", name: "SECRET. EXECUTIVA DE PROTEÇÃO E BEM-ESTAR ANIMAL" },
  { code: "01.12.004.00", name: "FUNDO DE ASSISTÊNCIA AO ESPORTE" },
  { code: "01.99.999.00", name: "RESERVA DE CONTINGÊNCIA" },
];

const DATA_2027 = [
  { organ: "01.08.000.00 - SECRETARIA DA EDUCAÇÃO", budgetUnit: "01.08.006.00 - SECRETARIA EXECUTIVA DE GESTÃO ESCOLAR", functionName: "Educação", subfunction: "Ensino Fundamental", program: "Educação para Todos", action: "Manutenção", expenseNature: "3.1.90.11.00", subelement: "33", administrativeProcess: "Transporte Escolar", value: 900000000 },
  { organ: "01.08.000.00 - SECRETARIA DA EDUCAÇÃO", budgetUnit: "01.08.008.00 - DIRETORIA GERAL DE GESTÃO ADMINISTRATIVA E FINANCE", functionName: "Educação", subfunction: "Ensino Fundamental", program: "Escola do Futuro", action: "Obras", expenseNature: "4.4.90.51.00", subelement: "51", administrativeProcess: "Modernização das Unidades Escolares", value: 410000000 },
  { organ: "01.08.000.00 - SECRETARIA DA EDUCAÇÃO", budgetUnit: "01.08.007.00 - SECRETARIA EXECUTIVA DE GESTÃO PEDAGÓGICA", functionName: "Educação", subfunction: "Ensino Fundamental", program: "Nutrição na Escola", action: "Manutenção", expenseNature: "3.3.90.30.00", subelement: "33", administrativeProcess: "Merenda Escolar", value: 200000000 },
  { organ: "01.08.000.00 - SECRETARIA DA EDUCAÇÃO", budgetUnit: "01.08.001.00 - GABINETE DA SECRETARIA DA EDUCAÇÃO", functionName: "Administração", subfunction: "Administração Geral", program: "Gestão da Educação", action: "Manutenção", expenseNature: "3.1.90.11.00", subelement: "33", administrativeProcess: "Tecnologia e Gestão Educacional", value: 115000000 },
  { organ: "01.09.000.00 - SECRETARIA DA SAÚDE", budgetUnit: "01.09.008.00 - DIRETORIA GERAL DE ATENÇÃO PRIMÁRIA EM SAÚDE", functionName: "Saúde", subfunction: "Atenção Básica", program: "Saúde da Família", action: "Manutenção", expenseNature: "3.1.90.11.00", subelement: "33", administrativeProcess: "Rede Municipal de Atenção Básica", value: 395000000 },
  { organ: "01.09.000.00 - SECRETARIA DA SAÚDE", budgetUnit: "01.09.007.00 - HOSPITAL MUNICIPAL ANTÔNIO GIGLIO", functionName: "Saúde", subfunction: "Assistência Hospitalar", program: "Assistência Hospitalar", action: "Manutenção", expenseNature: "3.3.90.39.00", subelement: "33", administrativeProcess: "Serviços Hospitalares Integrados", value: 310000000 },
  { organ: "01.09.000.00 - SECRETARIA DA SAÚDE", budgetUnit: "01.09.001.00 - GABINETE DA SECRETARIA DA SAÚDE", functionName: "Saúde", subfunction: "Assistência Hospitalar", program: "Saúde Mais Perto", action: "Obras", expenseNature: "4.4.90.51.00", subelement: "51", administrativeProcess: "Construção de UBS", value: 170000000 },
  { organ: "01.09.000.00 - SECRETARIA DA SAÚDE", budgetUnit: "01.09.011.00 - DEPARTAMENTO DE VIGILÂNCIA EM SAÚDE", functionName: "Saúde", subfunction: "Vigilância Epidemiológica", program: "Cidade Protegida", action: "Manutenção", expenseNature: "3.1.90.11.00", subelement: "33", administrativeProcess: "Vigilância Epidemiológica Municipal", value: 100000000 },
  { organ: "01.11.000.00 - SECRETARIA DE SERVIÇOS E OBRAS", budgetUnit: "01.11.007.00 - DEPTO DE OBRAS PÚBLICAS E INFRAESTRUTURA URBANA", functionName: "Urbanismo", subfunction: "Infraestrutura Urbana", program: "Cidade em Obras", action: "Obras", expenseNature: "4.4.90.51.00", subelement: "51", administrativeProcess: "Pavimentação", value: 650000000 },
  { organ: "01.11.000.00 - SECRETARIA DE SERVIÇOS E OBRAS", budgetUnit: "01.11.018.00 - DIRETORIA GERAL DE GESTÃO DE RESÍDUOS", functionName: "Saneamento", subfunction: "Saneamento Básico Urbano", program: "Saneamento para Todos", action: "Obras", expenseNature: "4.4.90.51.00", subelement: "51", administrativeProcess: "Ampliação da Rede de Saneamento", value: 430000000 },
  { organ: "01.13.000.00 - SECRETARIA DE HABITAÇÃO", budgetUnit: "01.13.001.00 - GABINETE DA SECRETARIA DE HABITAÇÃO", functionName: "Habitação", subfunction: "Habitação Urbana", program: "Morar Melhor", action: "Obras", expenseNature: "4.4.90.51.00", subelement: "51", administrativeProcess: "Programa Municipal de Habitação", value: 300000000 },
  { organ: "01.11.000.00 - SECRETARIA DE SERVIÇOS E OBRAS", budgetUnit: "01.11.017.00 - DIRETORIA GERAL DE ILUMINAÇÃO PÚBLICA", functionName: "Urbanismo", subfunction: "Serviços Urbanos", program: "Cidade Bem Cuidada", action: "Manutenção", expenseNature: "3.3.90.39.00", subelement: "33", administrativeProcess: "Iluminação Pública", value: 160000000 },
  { organ: "01.19.000.00 - SECRETARIA DE TRANSPORTES E MOBILIDADE URBANA=", budgetUnit: "01.19.001.00 - GABINETE DA SECRETARIA DE TRANSPORTES E DA MOBILID", functionName: "Transporte", subfunction: "Transporte Rodoviário", program: "Mobilidade Inteligente", action: "Obras", expenseNature: "4.4.90.51.00", subelement: "51", administrativeProcess: "Corredores Estruturais de Transporte", value: 480000000 },
  { organ: "01.19.000.00 - SECRETARIA DE TRANSPORTES E MOBILIDADE URBANA=", budgetUnit: "01.19.004.00 - DEPARTAMENTO MUNICIPAL DE TRANSPORTES", functionName: "Transporte", subfunction: "Transporte Rodoviário", program: "Transporte para Todos", action: "Manutenção", expenseNature: "3.3.90.39.00", subelement: "33", administrativeProcess: "Operação do Transporte Coletivo", value: 320000000 },
  { organ: "01.19.000.00 - SECRETARIA DE TRANSPORTES E MOBILIDADE URBANA=", budgetUnit: "01.19.005.00 - FUNDO MUNICIPAL DE TRÂNSITO", functionName: "Transporte", subfunction: "Transporte Rodoviário", program: "Trânsito Seguro", action: "Obras", expenseNature: "4.4.90.51.00", subelement: "51", administrativeProcess: "Sinalização e Segurança Viária", value: 210000000 },
  { organ: "01.19.000.00 - SECRETARIA DE TRANSPORTES E MOBILIDADE URBANA=", budgetUnit: "01.19.001.00 - GABINETE DA SECRETARIA DE TRANSPORTES E DA MOBILID", functionName: "Administração", subfunction: "Administração Geral", program: "Gestão da Mobilidade", action: "Manutenção", expenseNature: "3.1.90.11.00", subelement: "33", administrativeProcess: "Tecnologia de Controle de Tráfego", value: 130000000 },
  { organ: "01.14.000.00 - SECRETARIA DE ASSISTÊNCIA SOCIAL", budgetUnit: "01.14.007.00 - DEPARTAMENTO DE PROTEÇÃO SOCIAL BÁSICA", functionName: "Assistência Social", subfunction: "Assistência Comunitária", program: "Família Protegida", action: "Manutenção", expenseNature: "3.1.90.11.00", subelement: "33", administrativeProcess: "Rede de Proteção Social Básica", value: 300000000 },
  { organ: "01.36.000.00 - SECRETARIA DA FAMÍLIA, CIDADANIA E SEGURANÇA ALIME", budgetUnit: "01.36.002.00 - SECRETARIA EXECUTIVA DE SEGURANÇA ALIMENTAR E NUTR", functionName: "Assistência Social", subfunction: "Assistência Comunitária", program: "Alimento na Mesa", action: "Manutenção", expenseNature: "3.3.90.30.00", subelement: "33", administrativeProcess: "Programa Municipal de Segurança Alimentar", value: 210000000 },
  { organ: "01.07.000.00 - SECRETARIA DE EMPREGO, TRABALHO E RENDA", budgetUnit: "01.07.003.00 - DEPARTAMENTO DE APOIO À INCLUSÃO DO TRABALHADOR", functionName: "Trabalho", subfunction: "Fomento ao Trabalho", program: "Oportunidade para Todos", action: "Manutenção", expenseNature: "3.1.90.11.00", subelement: "33", administrativeProcess: "Capacitação e Inclusão Produtiva", value: 160000000 },
  { organ: "01.14.000.00 - SECRETARIA DE ASSISTÊNCIA SOCIAL", budgetUnit: "01.14.005.00 - FUNDO MUNICIPAL DE ASSISTÊNCIA SOCIAL", functionName: "Assistência Social", subfunction: "Assistência Comunitária", program: "Rede Social Presente", action: "Obras", expenseNature: "4.4.90.51.00", subelement: "51", administrativeProcess: "Construção de Centros de Referência", value: 90000000 },
  { organ: "01.20.000.00 - SECRETARIA DE SEGURANÇA E CONTROLE URBANO", budgetUnit: "01.20.006.00 - COMANDO GERAL DA GUARDA CIVIL MUNICIPAL", functionName: "Segurança", subfunction: "Policiamento", program: "Cidade Segura", action: "Manutenção", expenseNature: "3.1.90.11.00", subelement: "33", administrativeProcess: "Segurança Cidadã e Monitoramento", value: 205000000 },
  { organ: "01.15.000.00 - SECRETARIA DE CULTURA", budgetUnit: "01.15.004.00 - DEPARTAMENTO DE DIFUSÃO CULTURAL E ARTÍSTICA", functionName: "Cultura", subfunction: "Difusão Cultural", program: "Cultura Viva", action: "Manutenção", expenseNature: "3.3.90.39.00", subelement: "33", administrativeProcess: "Eventos Culturais e Bibliotecas", value: 120000000 },
  { organ: "01.18.000.00 - ENCARGOS GERAIS DO MUNICÍPIO", budgetUnit: "01.18.001.00 - RECURSOS SOB SUPERVISÃO DA SECRETARIA DE FINANÇAS", functionName: "Encargos Especiais", subfunction: "Serviço da Dívida Interna", program: "Gestão da Dívida", action: "Amortização", expenseNature: "4.6.90.71.00", subelement: "46", administrativeProcess: "Amortização da Dívida Pública", value: 135000000 }
];

async function main() {
  // Clear and seed BudgetOrgan list
  await prisma.budgetOrgan.deleteMany();
  await prisma.budgetOrgan.createMany({
    data: BUDGET_ORGANS
  });
  console.log(`Seeded ${BUDGET_ORGANS.length} budget organs.`);

  // Clear and seed BudgetUnit list
  await prisma.budgetUnit.deleteMany();
  await prisma.budgetUnit.createMany({
    data: BUDGET_UNITS
  });
  console.log(`Seeded ${BUDGET_UNITS.length} budget units.`);

  // Clear and seed budget records
  await prisma.loaImport.deleteMany();
  const imp = await prisma.loaImport.create({
    data: {
      fileName: "LOA_Consolidada_2027.xlsx",
      recordCount: DATA_2027.length,
      totalValue: 6500000000
    }
  });

  await prisma.budgetRecord.createMany({
    data: DATA_2027.map(r => ({ ...r, importId: imp.id }))
  });

  console.log("Seeding complete! Total value in DB is R$ 6.5 Billion.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
