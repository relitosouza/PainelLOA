/**
 * Agrupamento das secretarias em áreas temáticas para a página pública
 * Orçamento Transparente. Os códigos correspondem aos prefixos de
 * SECRETARIAS_ORCAMENTO (src/lib/banco-projetos-data.ts).
 */
export type AreaTransparente = {
  key: string;
  label: string;
  codigos: string[];
  icone: string;
  /** Classes Tailwind fixas — não montar por interpolação, o JIT não as geraria. */
  corTexto: string;
  corFundo: string;
  /** Se a área entra no detalhamento "Para onde vão cada R$ 100". */
  destaque: boolean;
  corBarra: string;
  tags: string[];
};

export const AREAS_TRANSPARENTE: AreaTransparente[] = [
  {
    key: "saude",
    label: "Saúde",
    codigos: ["09"],
    icone: "medical_services",
    corTexto: "text-emerald-600",
    corFundo: "bg-emerald-100 dark:bg-emerald-950/40",
    destaque: true,
    corBarra: "#A7F3D0",
    tags: ["Hospitais", "UBS", "medicamentos", "atendimento à população"],
  },
  {
    key: "educacao",
    label: "Educação",
    codigos: ["08"],
    icone: "school",
    corTexto: "text-blue-600",
    corFundo: "bg-blue-100 dark:bg-blue-950/40",
    destaque: true,
    corBarra: "#BAE6FD",
    tags: ["Escolas", "merenda", "transporte escolar", "ensino"],
  },
  {
    key: "obras",
    label: "Obras e Infraestrutura",
    codigos: ["11"],
    icone: "engineering",
    corTexto: "text-purple-600",
    corFundo: "bg-purple-100 dark:bg-purple-950/40",
    destaque: true,
    corBarra: "#FED7AA",
    tags: ["Pavimentação", "drenagem", "melhorias urbanas"],
  },
  {
    key: "mobilidade",
    label: "Mobilidade Urbana",
    codigos: ["19"],
    icone: "directions_bus",
    corTexto: "text-amber-600",
    corFundo: "bg-amber-100 dark:bg-amber-950/40",
    destaque: true,
    corBarra: "#FEF08A",
    tags: ["Trânsito", "transporte", "infraestrutura viária"],
  },
  {
    key: "social",
    label: "Assistência Social e Segurança",
    // 14 Assistência Social, 20 Segurança e Controle Urbano, 36 Família/Segurança Alimentar
    codigos: ["14", "20", "36"],
    icone: "shield",
    corTexto: "text-rose-600",
    corFundo: "bg-rose-100 dark:bg-rose-950/40",
    destaque: true,
    corBarra: "#F87171",
    tags: ["Proteção social", "Guarda Municipal", "segurança alimentar"],
  },
  {
    key: "cultura",
    label: "Cultura",
    codigos: ["15"],
    icone: "palette",
    corTexto: "text-pink-600",
    corFundo: "bg-pink-100 dark:bg-pink-950/40",
    destaque: false,
    corBarra: "#F9A8D4",
    tags: ["Eventos culturais", "bibliotecas", "incentivo à cultura"],
  },
  {
    key: "habitacao",
    label: "Habitação",
    codigos: ["13"],
    icone: "home",
    corTexto: "text-teal-600",
    corFundo: "bg-teal-100 dark:bg-teal-950/40",
    destaque: false,
    corBarra: "#99F6E4",
    tags: ["Construção de moradias", "melhorias habitacionais"],
  },
  {
    key: "emprego",
    label: "Emprego e Renda",
    codigos: ["07"],
    icone: "work",
    corTexto: "text-cyan-600",
    corFundo: "bg-cyan-100 dark:bg-cyan-950/40",
    destaque: false,
    corBarra: "#A5F3FC",
    tags: ["Qualificação profissional", "empreendedorismo", "geração de empregos"],
  },
];
