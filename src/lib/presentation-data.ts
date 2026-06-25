export type PresentationRecord = {
  secretariat: string;
  unit: string;
  functionName: string;
  program: string;
  process: string;
  category: "operating" | "investment";
  nature: "Pessoal" | "Custeio" | "Investimentos" | "Amortização";
  value: number;
};

const DATA_2027: PresentationRecord[] = [
  { secretariat: "Secretaria Municipal de Educação", unit: "Educação Básica", functionName: "Educação", program: "Educação para Todos", process: "Transporte Escolar", category: "operating", nature: "Custeio", value: 880_000_000 },
  { secretariat: "Secretaria Municipal de Educação", unit: "Infraestrutura Escolar", functionName: "Educação", program: "Escola do Futuro", process: "Modernização das Unidades Escolares", category: "investment", nature: "Investimentos", value: 420_000_000 },
  { secretariat: "Secretaria Municipal de Educação", unit: "Alimentação Escolar", functionName: "Educação", program: "Nutrição na Escola", process: "Merenda Escolar", category: "operating", nature: "Custeio", value: 310_000_000 },
  { secretariat: "Secretaria Municipal de Educação", unit: "Gestão Educacional", functionName: "Administração", program: "Gestão da Educação", process: "Tecnologia e Gestão Educacional", category: "operating", nature: "Pessoal", value: 190_000_000 },
  { secretariat: "Secretaria Municipal de Saúde", unit: "Atenção Básica", functionName: "Saúde", program: "Saúde da Família", process: "Rede Municipal de Atenção Básica", category: "operating", nature: "Pessoal", value: 720_000_000 },
  { secretariat: "Secretaria Municipal de Saúde", unit: "Rede Hospitalar", functionName: "Saúde", program: "Assistência Hospitalar", process: "Serviços Hospitalares Integrados", category: "operating", nature: "Custeio", value: 510_000_000 },
  { secretariat: "Secretaria Municipal de Saúde", unit: "Infraestrutura de Saúde", functionName: "Saúde", program: "Saúde Mais Perto", process: "Construção de UBS", category: "investment", nature: "Investimentos", value: 380_000_000 },
  { secretariat: "Secretaria Municipal de Saúde", unit: "Vigilância em Saúde", functionName: "Saúde", program: "Cidade Protegida", process: "Vigilância Epidemiológica Municipal", category: "operating", nature: "Pessoal", value: 210_000_000 },
  { secretariat: "Secretaria de Obras e Infraestrutura", unit: "Obras Públicas", functionName: "Urbanismo", program: "Cidade em Obras", process: "Pavimentação", category: "investment", nature: "Investimentos", value: 650_000_000 },
  { secretariat: "Secretaria de Obras e Infraestrutura", unit: "Saneamento", functionName: "Saneamento", program: "Saneamento para Todos", process: "Ampliação da Rede de Saneamento", category: "investment", nature: "Investimentos", value: 440_000_000 },
  { secretariat: "Secretaria de Obras e Infraestrutura", unit: "Habitação", functionName: "Habitação", program: "Morar Melhor", process: "Programa Municipal de Habitação", category: "investment", nature: "Investimentos", value: 300_000_000 },
  { secretariat: "Secretaria de Obras e Infraestrutura", unit: "Manutenção Urbana", functionName: "Urbanismo", program: "Cidade Bem Cuidada", process: "Iluminação Pública", category: "operating", nature: "Custeio", value: 160_000_000 },
  { secretariat: "Secretaria de Transporte e Mobilidade", unit: "Mobilidade Urbana", functionName: "Transporte", program: "Mobilidade Inteligente", process: "Corredores Estruturais de Transporte", category: "investment", nature: "Investimentos", value: 480_000_000 },
  { secretariat: "Secretaria de Transporte e Mobilidade", unit: "Transporte Coletivo", functionName: "Transporte", program: "Transporte para Todos", process: "Operação do Transporte Coletivo", category: "operating", nature: "Custeio", value: 320_000_000 },
  { secretariat: "Secretaria de Transporte e Mobilidade", unit: "Sistema Viário", functionName: "Transporte", program: "Trânsito Seguro", process: "Sinalização e Segurança Viária", category: "investment", nature: "Investimentos", value: 210_000_000 },
  { secretariat: "Secretaria de Transporte e Mobilidade", unit: "Gestão da Mobilidade", functionName: "Administração", program: "Gestão da Mobilidade", process: "Tecnologia de Controle de Tráfego", category: "operating", nature: "Pessoal", value: 130_000_000 },
  { secretariat: "Secretaria de Assistência Social", unit: "Proteção Social Básica", functionName: "Assistência Social", program: "Família Protegida", process: "Rede de Proteção Social Básica", category: "operating", nature: "Pessoal", value: 300_000_000 },
  { secretariat: "Secretaria de Assistência Social", unit: "Segurança Alimentar", functionName: "Assistência Social", program: "Alimento na Mesa", process: "Programa Municipal de Segurança Alimentar", category: "operating", nature: "Custeio", value: 210_000_000 },
  { secretariat: "Secretaria de Assistência Social", unit: "Inclusão Produtiva", functionName: "Trabalho", program: "Oportunidade para Todos", process: "Capacitação e Inclusão Produtiva", category: "operating", nature: "Pessoal", value: 160_000_000 },
  { secretariat: "Secretaria de Assistência Social", unit: "Equipamentos Sociais", functionName: "Assistência Social", program: "Rede Social Presente", process: "Construção de Centros de Referência", category: "investment", nature: "Investimentos", value: 90_000_000 },
  { secretariat: "Secretaria de Defesa Social e Segurança", unit: "Guarda Municipal", functionName: "Segurança", program: "Cidade Segura", process: "Segurança Cidadã e Monitoramento", category: "operating", nature: "Pessoal", value: 180_000_000 },
  { secretariat: "Secretaria Municipal de Cultura", unit: "Promoção da Cultura", functionName: "Cultura", program: "Cultura Viva", process: "Eventos Culturais e Bibliotecas", category: "operating", nature: "Custeio", value: 98_000_000 },
  { secretariat: "Secretaria de Finanças e Dívida", unit: "Serviço da Dívida", functionName: "Encargos Especiais", program: "Gestão da Dívida", process: "Amortização da Dívida Pública", category: "investment", nature: "Amortização", value: 120_000_000 },
];

export const PRESENTATION_SECRETARIATS = [...new Set(DATA_2027.map((record) => record.secretariat))].sort((a, b) => a.localeCompare(b, "pt-BR"));

export function getPresentationRecords(year: 2026 | 2027) {
  if (year === 2027) return DATA_2027;
  return DATA_2027.map((record, index) => ({ ...record, value: Math.round(record.value * (0.88 + (index % 4) * 0.01)) }));
}

export function groupPresentation(records: PresentationRecord[], field: "unit" | "functionName" | "program" | "process" | "secretariat") {
  const grouped = new Map<string, number>();
  for (const record of records) grouped.set(record[field], (grouped.get(record[field]) ?? 0) + record.value);
  return [...grouped].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}
