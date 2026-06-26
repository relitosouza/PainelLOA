export type SecretariatRecord = {
  secretariat: string;
  unit: string;
  functionName: string;
  program: string;
  process: string;
  expenseNature: string;
  category: "operating" | "investment";
  value: number;
};

const SECRETARIAT_DATA_2027: SecretariatRecord[] = [
  { secretariat: "01.08.000.00 - SECRETARIA DA EDUCAÇÃO", unit: "01.08.006.00 - SECRETARIA EXECUTIVA DE GESTÃO ESCOLAR", functionName: "Educação", program: "Educação para Todos", process: "Transporte Escolar", category: "operating", expenseNature: "Custeio", value: 900_000_000 },
  { secretariat: "01.08.000.00 - SECRETARIA DA EDUCAÇÃO", unit: "01.08.008.00 - DIRETORIA GERAL DE GESTÃO ADMINISTRATIVA E FINANCE", functionName: "Educação", program: "Escola do Futuro", process: "Modernização das Unidades Escolares", category: "investment", expenseNature: "Investimentos", value: 410_000_000 },
  { secretariat: "01.08.000.00 - SECRETARIA DA EDUCAÇÃO", unit: "01.08.007.00 - SECRETARIA EXECUTIVA DE GESTÃO PEDAGÓGICA", functionName: "Educação", program: "Nutrição na Escola", process: "Merenda Escolar", category: "operating", expenseNature: "Custeio", value: 200_000_000 },
  { secretariat: "01.08.000.00 - SECRETARIA DA EDUCAÇÃO", unit: "01.08.001.00 - GABINETE DA SECRETARIA DA EDUCAÇÃO", functionName: "Administração", program: "Gestão da Educação", process: "Tecnologia e Gestão Educacional", category: "operating", expenseNature: "Pessoal", value: 115_000_000 },
  { secretariat: "01.09.000.00 - SECRETARIA DA SAÚDE", unit: "01.09.008.00 - DIRETORIA GERAL DE ATENÇÃO PRIMÁRIA EM SAÚDE", functionName: "Saúde", program: "Saúde da Família", process: "Rede Municipal de Atenção Básica", category: "operating", expenseNature: "Pessoal", value: 395_000_000 },
  { secretariat: "01.09.000.00 - SECRETARIA DA SAÚDE", unit: "01.09.007.00 - HOSPITAL MUNICIPAL ANTÔNIO GIGLIO", functionName: "Saúde", program: "Assistência Hospitalar", process: "Serviços Hospitalares Integrados", category: "operating", expenseNature: "Custeio", value: 310_000_000 },
  { secretariat: "01.09.000.00 - SECRETARIA DA SAÚDE", unit: "01.09.001.00 - GABINETE DA SECRETARIA DA SAÚDE", functionName: "Saúde", program: "Saúde Mais Perto", process: "Construção de UBS", category: "investment", expenseNature: "Investimentos", value: 170_000_000 },
  { secretariat: "01.09.000.00 - SECRETARIA DA SAÚDE", unit: "01.09.011.00 - DEPARTAMENTO DE VIGILÂNCIA EM SAÚDE", functionName: "Saúde", program: "Cidade Protegida", process: "Vigilância Epidemiológica Municipal", category: "operating", expenseNature: "Pessoal", value: 100_000_000 },
  { secretariat: "01.11.000.00 - SECRETARIA DE SERVIÇOS E OBRAS", unit: "01.11.007.00 - DEPTO DE OBRAS PÚBLICAS E INFRAESTRUTURA URBANA", functionName: "Urbanismo", program: "Cidade em Obras", process: "Pavimentação", category: "investment", expenseNature: "Investimentos", value: 650_000_000 },
  { secretariat: "01.11.000.00 - SECRETARIA DE SERVIÇOS E OBRAS", unit: "01.11.018.00 - DIRETORIA GERAL DE GESTÃO DE RESÍDUOS", functionName: "Saneamento", program: "Saneamento para Todos", process: "Ampliação da Rede de Saneamento", category: "investment", expenseNature: "Investimentos", value: 430_000_000 },
  { secretariat: "01.13.000.00 - SECRETARIA DE HABITAÇÃO", unit: "01.13.001.00 - GABINETE DA SECRETARIA DE HABITAÇÃO", functionName: "Habitação", program: "Morar Melhor", process: "Programa Municipal de Habitação", category: "investment", expenseNature: "Investimentos", value: 300_000_000 },
  { secretariat: "01.11.000.00 - SECRETARIA DE SERVIÇOS E OBRAS", unit: "01.11.017.00 - DIRETORIA GERAL DE ILUMINAÇÃO PÚBLICA", functionName: "Urbanismo", program: "Cidade Bem Cuidada", process: "Iluminação Pública", category: "operating", expenseNature: "Custeio", value: 160_000_000 },
  { secretariat: "01.19.000.00 - SECRETARIA DE TRANSPORTES E MOBILIDADE URBANA=", unit: "01.19.001.00 - GABINETE DA SECRETARIA DE TRANSPORTES E DA MOBILID", functionName: "Transporte", program: "Mobilidade Inteligente", process: "Corredores Estruturais de Transporte", category: "investment", expenseNature: "Investimentos", value: 480_000_000 },
  { secretariat: "01.19.000.00 - SECRETARIA DE TRANSPORTES E MOBILIDADE URBANA=", unit: "01.19.004.00 - DEPARTAMENTO MUNICIPAL DE TRANSPORTES", functionName: "Transporte", program: "Transporte para Todos", process: "Operação do Transporte Coletivo", category: "operating", expenseNature: "Custeio", value: 320_000_000 },
  { secretariat: "01.19.000.00 - SECRETARIA DE TRANSPORTES E MOBILIDADE URBANA=", unit: "01.19.005.00 - FUNDO MUNICIPAL DE TRÂNSITO", functionName: "Transporte", program: "Trânsito Seguro", process: "Sinalização e Segurança Viária", category: "investment", expenseNature: "Investimentos", value: 210_000_000 },
  { secretariat: "01.19.000.00 - SECRETARIA DE TRANSPORTES E MOBILIDADE URBANA=", unit: "01.19.001.00 - GABINETE DA SECRETARIA DE TRANSPORTES E DA MOBILID", functionName: "Administração", program: "Gestão da Mobilidade", process: "Tecnologia de Controle de Tráfego", category: "operating", expenseNature: "Pessoal", value: 130_000_000 },
  { secretariat: "01.14.000.00 - SECRETARIA DE ASSISTÊNCIA SOCIAL", unit: "01.14.007.00 - DEPARTAMENTO DE PROTEÇÃO SOCIAL BÁSICA", functionName: "Assistência Social", program: "Família Protegida", process: "Rede de Proteção Social Básica", category: "operating", expenseNature: "Pessoal", value: 300_000_000 },
  { secretariat: "01.36.000.00 - SECRETARIA DA FAMÍLIA, CIDADANIA E SEGURANÇA ALIME", unit: "01.36.002.00 - SECRETARIA EXECUTIVA DE SEGURANÇA ALIMENTAR E NUTR", functionName: "Assistência Social", program: "Alimento na Mesa", process: "Programa Municipal de Segurança Alimentar", category: "operating", expenseNature: "Custeio", value: 210_000_000 },
  { secretariat: "01.07.000.00 - SECRETARIA DE EMPREGO, TRABALHO E RENDA", unit: "01.07.003.00 - DEPARTAMENTO DE APOIO À INCLUSÃO DO TRABALHADOR", functionName: "Trabalho", program: "Oportunidade para Todos", process: "Capacitação e Inclusão Produtiva", category: "operating", expenseNature: "Pessoal", value: 160_000_000 },
  { secretariat: "01.14.000.00 - SECRETARIA DE ASSISTÊNCIA SOCIAL", unit: "01.14.005.00 - FUNDO MUNICIPAL DE ASSISTÊNCIA SOCIAL", functionName: "Assistência Social", program: "Rede Social Presente", process: "Construção de Centros de Referência", category: "investment", expenseNature: "Investimentos", value: 90_000_000 },
  { secretariat: "01.20.000.00 - SECRETARIA DE SEGURANÇA E CONTROLE URBANO", unit: "01.20.006.00 - COMANDO GERAL DA GUARDA CIVIL MUNICIPAL", functionName: "Segurança", program: "Cidade Segura", process: "Segurança Cidadã e Monitoramento", category: "operating", expenseNature: "Pessoal", value: 205_000_000 },
  { secretariat: "01.15.000.00 - SECRETARIA DE CULTURA", unit: "01.15.004.00 - DEPARTAMENTO DE DIFUSÃO CULTURAL E ARTÍSTICA", functionName: "Cultura", program: "Cultura Viva", process: "Eventos Culturais e Bibliotecas", category: "operating", expenseNature: "Custeio", value: 120_000_000 },
  { secretariat: "01.18.000.00 - ENCARGOS GERAIS DO MUNICÍPIO", unit: "01.18.001.00 - RECURSOS SOB SUPERVISÃO DA SECRETARIA DE FINANÇAS", functionName: "Encargos Especiais", program: "Gestão da Dívida", process: "Amortização da Dívida Pública", category: "investment", expenseNature: "Amortização", value: 135_000_000 },
];

export const DEMO_SECRETARIATS = [...new Set(SECRETARIAT_DATA_2027.map((record) => record.secretariat))].sort((a, b) => a.localeCompare(b, "pt-BR"));

export function getSecretariatDemoRecords(year: 2026 | 2027) {
  if (year === 2027) return SECRETARIAT_DATA_2027;
  return SECRETARIAT_DATA_2027.map((record, index) => ({ ...record, value: Math.round(record.value * (0.9 + (index % 3) * 0.02)) }));
}
