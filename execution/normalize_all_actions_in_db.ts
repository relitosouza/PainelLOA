import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const ACTION_CANONICAL_MAP: Record<string, string> = {
  "0.001": "0.001 - Serviços da Dívida Pública",
  "0.002": "0.002 - Obrigações Tributárias e Contributivas",
  "0.003": "0.003 - Precatórios e Sentenças Judiciais",
  "1.001": "1.001 - Estudos, Pesquisas, Planos e Projetos",
  "1.002": "1.002 - Reforma e Ampliação de Unidades",
  "1.003": "1.003 - Implantação de Novas Unidades",
  "1.004": "1.004 - Expansão do Turismo",
  "1.005": "1.005 - Desenvolvimento da Infraestrutura Urbana",
  "1.006": "1.006 - Desenvolvimento da Infraestrutura Viária",
  "1.007": "1.007 - Drenagem Urbana",
  "1.008": "1.008 - Microdrenagem Urbana",
  "1.009": "1.009 - Urbanização de Favelas e Comunidades",
  "1.010": "1.010 - Requalificação de Favelas e Comunidades",
  "1.011": "1.011 - Regularização Fundiária de Assentamentos Precários, Loteamentos e Conjuntos Habitacionais",
  "1.012": "1.012 - Construção de Unidades Habitacionais",
  "1.013": "1.013 - Melhoria das Unidades Habitacionais",
  "1.014": "1.014 - Recuperação de Conjuntos Habitacionais",
  "2.001": "2.001 - Remuneração, Benefícios e Encargos",
  "2.002": "2.002 - Abastecimento de Frota",
  "2.003": "2.003 - Qualificação de Servidores e Processos Institucionais",
  "2.004": "2.004 - Qualificação Socioprofissional",
  "2.005": "2.005 - Promoção de Eventos, Comunicação e Participação Social",
  "2.006": "2.006 - Representações Oficiais",
  "2.007": "2.007 - Ampliação e Manutenção de Sistemas de Inteligência, Fiscalização e Tecnologia",
  "2.008": "2.008 - Estágio e Aprendizagem",
  "2.009": "2.009 - Locação de Imóveis",
  "2.010": "2.010 - Manutenção do Transporte Coletivo",
  "2.011": "2.011 - Manutenção de Equipamentos Públicos",
  "2.012": "2.012 - Manutenção de Equipamentos Públicos - Atenção Primária",
  "2.013": "2.013 - Manutenção de Equipamentos Públicos - Atenção Especializada",
  "2.014": "2.014 - Manutenção de Equipamentos Públicos - Atenção Hospitalar e Urgência e Emergência",
  "2.015": "2.015 - Manutenção de Equipamentos Públicos - Proteção Básica",
  "2.016": "2.016 - Manutenção de Equipamentos Públicos - Proteção Especial",
  "2.017": "2.017 - Suporte ao Aluno",
  "2.018": "2.018 - Conectividade e Tecnologia na Educação",
  "2.019": "2.019 - Ações Pedagógicas Complementares",
  "2.020": "2.020 - Transporte de Alunos",
  "2.021": "2.021 - Educação Cidadã",
  "2.022": "2.022 - Parcerias para Criação de Vagas",
  "2.023": "2.023 - Gestão Compartilhada de Equipamentos Públicos",
  "2.024": "2.024 - Distribuição de Alimentos e Benefícios para as Famílias em Situação de Vulnerabilidade",
  "2.025": "2.025 - Auxílio para Inclusão no Mercado de Trabalho",
  "2.026": "2.026 - Residências e Internações Compulsórias",
  "2.027": "2.027 - Intermediação Profissional",
  "2.028": "2.028 - Disseminação de Atividades Culturais e Esportivas Descentralizadas",
  "2.029": "2.029 - Valorização do Patrimônio Histórico-Cultural",
  "2.030": "2.030 - Apoio ao Esporte de Alto Rendimento",
  "2.031": "2.031 - Esporte Amador",
  "2.032": "2.032 - Iniciação Esportiva",
  "2.033": "2.033 - Fortalecimento da Economia Criativa e Solidária",
  "2.034": "2.034 - Manutenção da Infraestrutura Viária",
  "2.035": "2.035 - Manutenção e Serviços de Drenagem Urbana",
  "2.036": "2.036 - Manutenção da Mobilidade Ativa",
  "2.037": "2.037 - Ampliação e Manutenção de Áreas Verdes",
  "2.038": "2.038 - Iluminação Pública",
  "2.039": "2.039 - Limpeza Urbana e Gestão de Resíduos Sólidos",
  "2.040": "2.040 - Auxílio para Acesso à Moradia",
  "2.041": "2.041 - Ação Transversal de Garantia de Direitos",
  "2.042": "2.042 - Manutenção das Atividades Legislativas",
  "2.043": "2.043 - Benefícios Previdenciários",
  "2.044": "2.044 - Reserva de Contingência",
  "9.999": "9.999 - Reserva de Contingência",
};

export function extractActionCode(val: string): string | null {
  if (!val) return null;
  const clean = val.trim();
  const match = clean.match(/^(\d+[\.\d]*|\d+)/);
  return match ? match[1] : null;
}

export function getCanonicalActionLabel(val: string): string {
  if (!val) return val;
  const clean = val.trim();
  
  // Extrair código numérico ex: 0.001, 2.001, 9.999
  const code = extractActionCode(clean);
  if (code && ACTION_CANONICAL_MAP[code]) {
    return ACTION_CANONICAL_MAP[code];
  }

  // Se já tiver formato "X.XXX - Nome", limpar espaços extras e hífens múltiplos
  return clean
    .replace(/^(\d+[\.\d]*)\s*[-—–]+\s*/, "$1 - ")
    .replace(/\s+/g, " ");
}

async function main() {
  console.log("=== NORMALIZANDO AÇÕES NA LOA E LDO NO BANCO DE DADOS ===");

  // 1. Normalizar BudgetRecord (LOA)
  const loaRecords = await prisma.budgetRecord.findMany({ select: { id: true, action: true } });
  let loaUpdated = 0;
  for (const r of loaRecords) {
    if (r.action) {
      const canonical = getCanonicalActionLabel(r.action);
      if (canonical !== r.action) {
        await prisma.budgetRecord.update({
          where: { id: r.id },
          data: { action: canonical },
        });
        loaUpdated++;
      }
    }
  }
  console.log(`LOA BudgetRecords atualizados: ${loaUpdated} de ${loaRecords.length}`);

  // 2. Normalizar LdoAcao (LDO)
  const ldoRecords = await prisma.ldoAcao.findMany({ select: { id: true, acaoCodigo: true, acaoNome: true } });
  let ldoUpdated = 0;
  for (const r of ldoRecords) {
    const code = extractActionCode(r.acaoCodigo) || extractActionCode(r.acaoNome || "");
    if (code && ACTION_CANONICAL_MAP[code]) {
      const canonicalFull = ACTION_CANONICAL_MAP[code];
      const nameOnly = canonicalFull.replace(/^[\d\.]+\s*-\s*/, "");
      
      if (r.acaoCodigo !== code || r.acaoNome !== nameOnly) {
        await prisma.ldoAcao.update({
          where: { id: r.id },
          data: {
            acaoCodigo: code,
            acaoNome: nameOnly,
          },
        });
        ldoUpdated++;
      }
    }
  }
  console.log(`LDO Ações atualizadas: ${ldoUpdated} de ${ldoRecords.length}`);

  console.log("🎉 NORMALIZAÇÃO DE AÇÕES NO BANCO DE DADOS CONCLUÍDA!");
}

main().finally(() => prisma.$disconnect());
