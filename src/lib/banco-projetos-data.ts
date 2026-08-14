export type BancoProjetosSecretaria = { secretaria: string; projetos: number; valor: number };
export type BancoProjetosDetalhes = { editais: number; naturezas: string[] };

export const BANCO_PROJETOS_TOTAL_REGISTROS = 175;
export const BANCO_PROJETOS_TOTAL_VALOR = 264155332.95;

export const BANCO_PROJETOS_SECRETARIAS: BancoProjetosSecretaria[] = [
  { secretaria: "13 - SECRETARIA DE HABITAÇÃO", projetos: 23, valor: 126723821.29 },
  { secretaria: "11 - SECRETARIA DE SERVIÇOS E OBRAS", projetos: 13, valor: 33999919.77 },
  { secretaria: "17 - SECRETARIA DE MEIO AMBIENTE E RECURSOS HÍDRICOS", projetos: 5, valor: 25450000 },
  { secretaria: "23 - SECRETARIA DE COMUNICAÇÃO", projetos: 1, valor: 24000000 },
  { secretaria: "08 - SECRETARIA DE EDUCAÇÃO", projetos: 10, valor: 13060000 },
  { secretaria: "30 - SECRETARIA EXECUTIVA DA PESSOA COM DEFICIÊNCIA", projetos: 8, valor: 9509000 },
  { secretaria: "20 - SECRETARIA DE SEGURANÇA E CONTROLE URBANO", projetos: 18, valor: 6423538.92 },
  { secretaria: "34 - COORDENADORIA DA DEFESA CIVIL", projetos: 5, valor: 5422143.04 },
  { secretaria: "16 - SECRETARIA DE TECNOLOGIA, INOVAÇÃO E DESENVOLVIMENTO ECONÔMICO", projetos: 17, valor: 5175080 },
  { secretaria: "15 - SECRETARIA DA CULTURA", projetos: 1, valor: 4500000 },
  { secretaria: "14 - SECRETARIA DE ASSISTÊNCIA SOCIAL", projetos: 10, valor: 3499756.4 },
  { secretaria: "31 - SECRETARIA EXECUTIVA DE POLITICAS DE PROMOÇÃO DA IGUALDADE RACIAL", projetos: 6, valor: 2310000 },
  { secretaria: "36 - SECRETARIA DA FAMÍLIA, CIDADANIA E SEGURANÇA ALIMENTAR", projetos: 23, valor: 1778596.49 },
  { secretaria: "12 - SECRETARIA DE ESPORTE, RECREAÇÃO E LAZER", projetos: 3, valor: 701000 },
  { secretaria: "02 - GABINETE DO PREFEITO", projetos: 9, valor: 694700 },
  { secretaria: "04 - SECRETARIA DE FINANÇAS", projetos: 2, valor: 500000 },
  { secretaria: "07 - SECRETARIA DE EMPREGO, TRABALHO E RENDA", projetos: 2, valor: 300000 },
  { secretaria: "35 - SECRETARIA DA CASA CIVIL", projetos: 4, valor: 81000 },
  { secretaria: "28 - SECRETARIA DE GOVERNO", projetos: 7, valor: 26777.04 },
  { secretaria: "18 - ENCARGOS/TECNOLOGIA", projetos: 8, valor: 0 },
];

export const BANCO_PROJETOS_DETALHES: Record<string, BancoProjetosDetalhes> = {
  "13 - SECRETARIA DE HABITAÇÃO": { editais: 15, naturezas: ["4.4.90.51", "3.3.90.39", "3.3.50.39", "4.4.50.52", "3.3.90.40", "3.3.90.48", "4.4.90.52", "3.3.90.30"] },
  "11 - SECRETARIA DE SERVIÇOS E OBRAS": { editais: 6, naturezas: ["4.4.90.51", "3.3.90.30"] },
  "17 - SECRETARIA DE MEIO AMBIENTE E RECURSOS HÍDRICOS": { editais: 0, naturezas: ["4.4.90.52", "4.4.90.51", "3.3.90.39"] },
  "23 - SECRETARIA DE COMUNICAÇÃO": { editais: 1, naturezas: ["3.3.90.39"] },
  "08 - SECRETARIA DE EDUCAÇÃO": { editais: 0, naturezas: ["4.4.50.52", "3.3.50.39", "4.4.90.52", "3.3.90.30", "3.3.90.39", "3.3.90.40"] },
  "30 - SECRETARIA EXECUTIVA DA PESSOA COM DEFICIÊNCIA": { editais: 8, naturezas: [] },
  "20 - SECRETARIA DE SEGURANÇA E CONTROLE URBANO": { editais: 18, naturezas: ["3.3.90.39", "3.3.90.30", "4.4.90.52"] },
  "34 - COORDENADORIA DA DEFESA CIVIL": { editais: 5, naturezas: ["3.3.90.39", "4.4.90.52", "3.3.90.30", "3.3.90.33"] },
  "16 - SECRETARIA DE TECNOLOGIA, INOVAÇÃO E DESENVOLVIMENTO ECONÔMICO": { editais: 17, naturezas: ["4.4.90.52", "3.3.90.39", "3.3.90.33", "4.4.90.51", "3.3.90.30"] },
  "15 - SECRETARIA DA CULTURA": { editais: 1, naturezas: ["3.3.50.39"] },
  "14 - SECRETARIA DE ASSISTÊNCIA SOCIAL": { editais: 10, naturezas: ["3.3.90.35", "3.3.90.39", "3.3.50.39", "3.1.90.11", "3.1.90.13", "3.3.90.48"] },
  "31 - SECRETARIA EXECUTIVA DE POLITICAS DE PROMOÇÃO DA IGUALDADE RACIAL": { editais: 5, naturezas: ["4.4.90.51", "3.3.90.39", "4.4.90.52"] },
  "36 - SECRETARIA DA FAMÍLIA, CIDADANIA E SEGURANÇA ALIMENTAR": { editais: 23, naturezas: ["4.4.90.52", "3.3.90.39", "3.3.90.30", "3.3.90.32"] },
  "12 - SECRETARIA DE ESPORTE, RECREAÇÃO E LAZER": { editais: 3, naturezas: ["3.3.90.39", "3.3.90.30", "4.4.90.51"] },
  "02 - GABINETE DO PREFEITO": { editais: 0, naturezas: ["3.3.90.30", "3.3.90.39", "4.4.50.52"] },
  "04 - SECRETARIA DE FINANÇAS": { editais: 0, naturezas: ["3.3.90.39"] },
  "07 - SECRETARIA DE EMPREGO, TRABALHO E RENDA": { editais: 0, naturezas: ["3.3.90.39", "3.3.90.30"] },
  "35 - SECRETARIA DA CASA CIVIL": { editais: 0, naturezas: ["4.4.90.52", "3.3.90.39"] },
  "28 - SECRETARIA DE GOVERNO": { editais: 6, naturezas: ["3.3.90.39", "3.3.90.36", "3.1.90.11"] },
  "18 - ENCARGOS/TECNOLOGIA": { editais: 0, naturezas: ["4.4.90.52", "3.3.90.40", "3.3.90.39"] },
};
