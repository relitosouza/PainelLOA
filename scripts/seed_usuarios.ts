import { PrismaClient, PapelUsuario } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

interface SeedUser {
  nome: string;
  email: string;
  papel: PapelUsuario;
  senhaPlana: string;
  secretaria?: string;
  codigoSecretaria?: string;
  cargo?: string;
  telefone?: string;
  ativo: boolean;
}

const USUARIOS_PADRAO: SeedUser[] = [
  // 1. ADMIN - Administrador Geral
  {
    nome: "Administrador do Sistema",
    email: "admin@osasco.sp.gov.br",
    papel: "ADMIN",
    senhaPlana: "Admin@Osasco2027",
    cargo: "Administrador Geral do Sistema",
    telefone: "(11) 3652-9000",
    ativo: true,
  },
  // 2. PLANEJAMENTO - Equipe Central de Planejamento e Finanças
  {
    nome: "Alex - Planejamento LOA",
    email: "alex.sf@osasco.sp.gov.br",
    papel: "PLANEJAMENTO",
    senhaPlana: "Plan@Osasco2027",
    secretaria: "SECRETARIA DE FINANÇAS",
    codigoSecretaria: "04",
    cargo: "Diretor de Planejamento Orçamentário",
    telefone: "(11) 3652-9040",
    ativo: true,
  },
  {
    nome: "Equipe Central de Planejamento",
    email: "planejamento@osasco.sp.gov.br",
    papel: "PLANEJAMENTO",
    senhaPlana: "Plan@Osasco2027",
    secretaria: "SECRETARIA DE PLANEJAMENTO E GESTÃO",
    codigoSecretaria: "24",
    cargo: "Analista de Planejamento e Orçamento",
    telefone: "(11) 3652-9240",
    ativo: true,
  },
  // 3. TECNICO_SECRETARIA - Técnicos Setoriais por Secretaria
  {
    nome: "Técnico Setorial - Saúde",
    email: "tecnico.saude@osasco.sp.gov.br",
    papel: "TECNICO_SECRETARIA",
    senhaPlana: "Saude@Osasco2027",
    secretaria: "SECRETARIA DA SAÚDE",
    codigoSecretaria: "09",
    cargo: "Analista Orçamentário da Saúde",
    telefone: "(11) 3652-9090",
    ativo: true,
  },
  {
    nome: "Técnico Setorial - Educação",
    email: "tecnico.educacao@osasco.sp.gov.br",
    papel: "TECNICO_SECRETARIA",
    senhaPlana: "Educacao@Osasco2027",
    secretaria: "SECRETARIA DE EDUCAÇÃO",
    codigoSecretaria: "08",
    cargo: "Analista Orçamentário da Educação",
    telefone: "(11) 3652-9080",
    ativo: true,
  },
  {
    nome: "Técnico Setorial - Obras e Serviços",
    email: "tecnico.obras@osasco.sp.gov.br",
    papel: "TECNICO_SECRETARIA",
    senhaPlana: "Obras@Osasco2027",
    secretaria: "SECRETARIA DE SERVIÇOS E OBRAS",
    codigoSecretaria: "11",
    cargo: "Analista de Gestão de Obras",
    telefone: "(11) 3652-9110",
    ativo: true,
  },
  {
    nome: "Técnico Setorial - Assistência Social",
    email: "tecnico.social@osasco.sp.gov.br",
    papel: "TECNICO_SECRETARIA",
    senhaPlana: "Social@Osasco2027",
    secretaria: "SECRETARIA DE ASSISTÊNCIA SOCIAL",
    codigoSecretaria: "14",
    cargo: "Analista de Projetos Sociais",
    telefone: "(11) 3652-9140",
    ativo: true,
  },
  {
    nome: "Técnico Setorial - Segurança Urbana",
    email: "tecnico.seguranca@osasco.sp.gov.br",
    papel: "TECNICO_SECRETARIA",
    senhaPlana: "Seguranca@Osasco2027",
    secretaria: "SECRETARIA DE SEGURANÇA E CONTROLE URBANO",
    codigoSecretaria: "20",
    cargo: "Analista de Segurança Pública",
    telefone: "(11) 3652-9200",
    ativo: true,
  },
  {
    nome: "Técnico Setorial - Transporte e Mobilidade",
    email: "tecnico.transporte@osasco.sp.gov.br",
    papel: "TECNICO_SECRETARIA",
    senhaPlana: "Transporte@Osasco2027",
    secretaria: "SECRETARIA DE TRANSPORTE E DA MOBILIDADE URBANA",
    codigoSecretaria: "19",
    cargo: "Analista de Mobilidade Urbana",
    telefone: "(11) 3652-9190",
    ativo: true,
  },
  {
    nome: "Técnico Setorial - Habitação",
    email: "tecnico.habitacao@osasco.sp.gov.br",
    papel: "TECNICO_SECRETARIA",
    senhaPlana: "Habitacao@Osasco2027",
    secretaria: "SECRETARIA DE HABITAÇÃO",
    codigoSecretaria: "13",
    cargo: "Analista de Programas Habitacionais",
    telefone: "(11) 3652-9130",
    ativo: true,
  },
  {
    nome: "Técnico Setorial - Meio Ambiente",
    email: "tecnico.meioambiente@osasco.sp.gov.br",
    papel: "TECNICO_SECRETARIA",
    senhaPlana: "Ambiente@Osasco2027",
    secretaria: "SECRETARIA DE MEIO AMBIENTE E RECURSOS HÍDRICOS",
    codigoSecretaria: "17",
    cargo: "Analista Ambiental",
    telefone: "(11) 3652-9170",
    ativo: true,
  },
  // 4. LEITURA - Auditoria e Consulta
  {
    nome: "Auditoria Interna / CGM",
    email: "auditoria@osasco.sp.gov.br",
    papel: "LEITURA",
    senhaPlana: "Consulta@Osasco2027",
    secretaria: "CONTROLADORIA GERAL DO MUNICÍPIO",
    codigoSecretaria: "27",
    cargo: "Auditor de Controle Interno",
    telefone: "(11) 3652-9270",
    ativo: true,
  },
  {
    nome: "Consulta Geral - Transparência",
    email: "transparencia@osasco.sp.gov.br",
    papel: "LEITURA",
    senhaPlana: "Leitura@Osasco2027",
    secretaria: "GABINETE DO PREFEITO",
    codigoSecretaria: "02",
    cargo: "Consultor de Transparência Pública",
    telefone: "(11) 3652-9020",
    ativo: true,
  },
];

async function seedUsuarios() {
  console.log("================================================================================");
  console.log("Iniciando Seed de Usuários, Perfis e Senhas do Painel LOA...");
  console.log("================================================================================\n");

  const results = [];

  for (const item of USUARIOS_PADRAO) {
    const senhaHash = hashPassword(item.senhaPlana);

    const usuario = await prisma.usuario.upsert({
      where: { email: item.email },
      update: {
        nome: item.nome,
        papel: item.papel,
        senhaHash: senhaHash,
        secretaria: item.secretaria || null,
        codigoSecretaria: item.codigoSecretaria || null,
        cargo: item.cargo || null,
        telefone: item.telefone || null,
        ativo: item.ativo,
      },
      create: {
        nome: item.nome,
        email: item.email,
        papel: item.papel,
        senhaHash: senhaHash,
        secretaria: item.secretaria || null,
        codigoSecretaria: item.codigoSecretaria || null,
        cargo: item.cargo || null,
        telefone: item.telefone || null,
        ativo: item.ativo,
      },
    });

    results.push({
      Perfil: usuario.papel,
      Nome: usuario.nome,
      Email: usuario.email,
      SenhaPadrao: item.senhaPlana,
      Secretaria: usuario.secretaria || "Geral (Todas)",
      Cod: usuario.codigoSecretaria || "-",
      Cargo: usuario.cargo || "-",
    });
  }

  console.table(results);
  console.log(`\n✅ Sucesso: ${results.length} usuários e perfis sincronizados no banco de dados.`);
}

seedUsuarios()
  .catch((error) => {
    console.error("❌ Erro ao executar seed de usuários:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
