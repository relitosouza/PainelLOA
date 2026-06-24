export type SecretariatRecord = {
  secretariat: string;
  unit: string;
  functionName: string;
  program: string;
  process: string;
  category: "operating" | "investment";
  value: number;
};

const SECRETARIAT_DATA_2027: SecretariatRecord[] = [
  { secretariat: "Secretaria Municipal de Administracao", unit: "Gestao Administrativa", functionName: "Administracao", program: "Gestao Eficiente", process: "Apoio Operacional da Secretaria", category: "operating", value: 145_000_000 },
  { secretariat: "Secretaria Municipal de Administracao", unit: "Tecnologia da Informacao", functionName: "Administracao", program: "Governo Digital", process: "Modernizacao de Sistemas Institucionais", category: "investment", value: 62_000_000 },
  { secretariat: "Secretaria Municipal de Meio Ambiente", unit: "Fiscalizacao Ambiental", functionName: "Gestao Ambiental", program: "Cidade Sustentavel", process: "Fiscalizacao e Monitoramento Ambiental", category: "operating", value: 88_000_000 },
  { secretariat: "Secretaria Municipal de Meio Ambiente", unit: "Parques e Areas Verdes", functionName: "Urbanismo", program: "Verde para Todos", process: "Implantacao e Recuperacao de Parques", category: "investment", value: 54_000_000 },
  { secretariat: "Secretaria Municipal de Cultura", unit: "Fomento Cultural", functionName: "Cultura", program: "Cultura Viva", process: "Editais e Incentivo a Projetos Culturais", category: "operating", value: 73_000_000 },
  { secretariat: "Secretaria Municipal de Cultura", unit: "Equipamentos Culturais", functionName: "Cultura", program: "Rede Cultural", process: "Manutencao de Teatros e Centros Culturais", category: "investment", value: 39_000_000 },
  { secretariat: "Secretaria Municipal de Seguranca", unit: "Guarda Municipal", functionName: "Seguranca Publica", program: "Cidade Segura", process: "Patrulhamento e Monitoramento Urbano", category: "operating", value: 128_000_000 },
  { secretariat: "Secretaria Municipal de Seguranca", unit: "Tecnologia e Videomonitoramento", functionName: "Seguranca Publica", program: "Vigilancia Inteligente", process: "Expansao da Central de Monitoramento", category: "investment", value: 91_000_000 },
  { secretariat: "Secretaria Municipal de Desenvolvimento Economico", unit: "Empreendedorismo", functionName: "Trabalho", program: "Emprega Cidade", process: "Qualificacao e Insercao Profissional", category: "operating", value: 96_000_000 },
  { secretariat: "Secretaria Municipal de Desenvolvimento Economico", unit: "Inovacao e Negocios", functionName: "Industria", program: "Cidade Inovadora", process: "Apoio a Parques Tecnologicos e Startups", category: "investment", value: 58_000_000 },
];

export const DEMO_SECRETARIATS = [...new Set(SECRETARIAT_DATA_2027.map((record) => record.secretariat))].sort((a, b) => a.localeCompare(b, "pt-BR"));

export function getSecretariatDemoRecords(year: 2026 | 2027) {
  if (year === 2027) return SECRETARIAT_DATA_2027;
  return SECRETARIAT_DATA_2027.map((record, index) => ({ ...record, value: Math.round(record.value * (0.9 + (index % 3) * 0.02)) }));
}
