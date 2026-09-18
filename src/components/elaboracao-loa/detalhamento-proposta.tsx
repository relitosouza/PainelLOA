"use client";

import { Fragment, useMemo, useState } from "react";
import { currency, percent } from "@/lib/format";

// PROTÓTIPO: dados fictícios, ainda não ligados à planilha/banco.

type Leaf = { id: string; nome: string; vinculo: string; obs: string; ldo: number; base: number; travado?: boolean; motivoTrava?: string };
type Nivel = "secretaria" | "funcao" | "programa" | "acao" | "natureza";
type Node = { id: string; nome: string; nivel: Nivel; children: Node[] | Leaf[] };
type Ajuste = { valor: number; justificativa: string };

type Linha = {
  secretaria: string; funcao: string; programa: string; acao: string; natureza: string;
  subelemento: string; vinculo: string; obs: string; ldo: number; base: number; motivoTrava?: string;
};

const LINHAS: Linha[] = [
  { secretaria: "12 - Secretaria de Educação", funcao: "12 - Educação / 361 - Ensino Fundamental", programa: "0012 - Educação Básica de Qualidade", acao: "2.101 - Manutenção do Ensino Fundamental", natureza: "3.1.90.11 - Vencimentos e Vantagens Fixas", subelemento: "01 - Vencimentos e Salários", vinculo: "01.220.0000", obs: "Folha 2026 com reajuste de 4,5%", ldo: 410_000_000, base: 425_300_000, motivoTrava: "Pessoal" },
  { secretaria: "12 - Secretaria de Educação", funcao: "12 - Educação / 361 - Ensino Fundamental", programa: "0012 - Educação Básica de Qualidade", acao: "2.101 - Manutenção do Ensino Fundamental", natureza: "3.3.90.39 - Serviços de Terceiros PJ", subelemento: "77 - Vigilância Ostensiva", vinculo: "01.220.0000", obs: "Proc. 1234/2025", ldo: 32_000_000, base: 34_700_000 },
  { secretaria: "12 - Secretaria de Educação", funcao: "12 - Educação / 361 - Ensino Fundamental", programa: "0012 - Educação Básica de Qualidade", acao: "2.101 - Manutenção do Ensino Fundamental", natureza: "3.3.90.39 - Serviços de Terceiros PJ", subelemento: "78 - Limpeza e Conservação", vinculo: "01.220.0000", obs: "", ldo: 26_000_000, base: 26_500_000 },
  { secretaria: "12 - Secretaria de Educação", funcao: "12 - Educação / 361 - Ensino Fundamental", programa: "0012 - Educação Básica de Qualidade", acao: "2.101 - Manutenção do Ensino Fundamental", natureza: "3.3.90.30 - Material de Consumo", subelemento: "16 - Material de Expediente", vinculo: "01.110.0000", obs: "", ldo: 22_500_000, base: 19_800_000 },
  { secretaria: "12 - Secretaria de Educação", funcao: "12 - Educação / 306 - Alimentação e Nutrição", programa: "0012 - Educação Básica de Qualidade", acao: "2.104 - Alimentação Escolar", natureza: "3.3.90.39 - Serviços de Terceiros PJ", subelemento: "41 - Fornecimento de Alimentação", vinculo: "05.220.0000", obs: "Contrato 045/2024 vigente", ldo: 96_000_000, base: 102_400_000, motivoTrava: "Contrato iniciado" },
  { secretaria: "12 - Secretaria de Educação", funcao: "12 - Educação / 306 - Alimentação e Nutrição", programa: "0012 - Educação Básica de Qualidade", acao: "2.104 - Alimentação Escolar", natureza: "3.3.90.30 - Material de Consumo", subelemento: "07 - Gêneros de Alimentação", vinculo: "05.220.0000", obs: "PNAE", ldo: 14_000_000, base: 15_100_000 },
  { secretaria: "12 - Secretaria de Educação", funcao: "12 - Educação / 365 - Educação Infantil", programa: "0013 - Infraestrutura Escolar", acao: "1.120 - Construção de Creches", natureza: "4.4.90.51 - Obras e Instalações", subelemento: "91 - Obras em Andamento", vinculo: "02.100.0000", obs: "Banco de Projetos", ldo: 45_000_000, base: 62_000_000 },
  { secretaria: "12 - Secretaria de Educação", funcao: "12 - Educação / 365 - Educação Infantil", programa: "0013 - Infraestrutura Escolar", acao: "1.120 - Construção de Creches", natureza: "4.4.90.52 - Equipamentos e Material Permanente", subelemento: "42 - Mobiliário em Geral", vinculo: "01.110.0000", obs: "", ldo: 6_000_000, base: 8_400_000 },
  { secretaria: "14 - Secretaria de Saúde", funcao: "10 - Saúde / 301 - Atenção Básica", programa: "0020 - Atenção à Saúde", acao: "2.201 - Atenção Básica", natureza: "3.1.90.11 - Vencimentos e Vantagens Fixas", subelemento: "01 - Vencimentos e Salários", vinculo: "01.310.0000", obs: "", ldo: 380_000_000, base: 391_000_000, motivoTrava: "Pessoal" },
  { secretaria: "14 - Secretaria de Saúde", funcao: "10 - Saúde / 301 - Atenção Básica", programa: "0020 - Atenção à Saúde", acao: "2.201 - Atenção Básica", natureza: "3.3.50.39 - Serviços de Terceiros PJ (OS)", subelemento: "99 - Contrato de Gestão", vinculo: "05.300.0000", obs: "Renovação prevista em jul/2026", ldo: 210_000_000, base: 238_000_000 },
  { secretaria: "14 - Secretaria de Saúde", funcao: "10 - Saúde / 303 - Suporte Profilático e Terapêutico", programa: "0020 - Atenção à Saúde", acao: "2.210 - Assistência Farmacêutica", natureza: "3.3.90.30 - Material de Consumo", subelemento: "09 - Material Farmacológico", vinculo: "01.310.0000", obs: "", ldo: 48_000_000, base: 55_500_000 },
  { secretaria: "20 - Secretaria de Obras", funcao: "15 - Urbanismo / 451 - Infraestrutura Urbana", programa: "0031 - Cidade Mais Conectada", acao: "1.310 - Pavimentação e Drenagem", natureza: "4.4.90.51 - Obras e Instalações", subelemento: "91 - Obras em Andamento", vinculo: "02.100.0000", obs: "Operação de crédito", ldo: 120_000_000, base: 164_000_000 },
  { secretaria: "20 - Secretaria de Obras", funcao: "15 - Urbanismo / 452 - Serviços Urbanos", programa: "0031 - Cidade Mais Conectada", acao: "2.320 - Manutenção de Vias", natureza: "3.3.90.39 - Serviços de Terceiros PJ", subelemento: "16 - Manutenção de Vias Públicas", vinculo: "01.110.0000", obs: "Contrato 112/2023", ldo: 72_000_000, base: 79_300_000, motivoTrava: "Contrato iniciado" },
  { secretaria: "20 - Secretaria de Obras", funcao: "15 - Urbanismo / 452 - Serviços Urbanos", programa: "0031 - Cidade Mais Conectada", acao: "2.320 - Manutenção de Vias", natureza: "3.3.90.30 - Material de Consumo", subelemento: "24 - Material para Manutenção de Bens Imóveis", vinculo: "01.110.0000", obs: "", ldo: 18_000_000, base: 23_600_000 },
];

const NIVEIS: Nivel[] = ["secretaria", "funcao", "programa", "acao", "natureza"];

function buildTree(linhas: Linha[], depth = 0, prefix = ""): Node[] | Leaf[] {
  if (depth === NIVEIS.length) {
    return linhas.map((linha, index) => ({
      id: `${prefix}|${linha.subelemento}|${linha.vinculo}|${index}`,
      nome: linha.subelemento, vinculo: linha.vinculo, obs: linha.obs, ldo: linha.ldo, base: linha.base,
      travado: Boolean(linha.motivoTrava), motivoTrava: linha.motivoTrava,
    }));
  }
  const nivel = NIVEIS[depth];
  const groups = new Map<string, Linha[]>();
  linhas.forEach((linha) => groups.set(linha[nivel], [...(groups.get(linha[nivel]) ?? []), linha]));
  return [...groups.entries()].map(([nome, items]) => {
    const id = `${prefix}|${nome}`;
    return { id, nome, nivel, children: buildTree(items, depth + 1, id) };
  });
}

const MOCK = buildTree(LINHAS) as Node[];
const NIVEL_LABEL: Record<Nivel, string> = { secretaria: "Secretaria", funcao: "Função/Subfunção", programa: "Programa", acao: "Ação", natureza: "Natureza" };

const isLeaf = (item: Node | Leaf): item is Leaf => "base" in item;

function collectLeaves(node: Node | Leaf): Leaf[] {
  return isLeaf(node) ? [node] : (node.children as (Node | Leaf)[]).flatMap(collectLeaves);
}

function collectNodeIds(nodes: (Node | Leaf)[]): string[] {
  return nodes.flatMap((node) => isLeaf(node) ? [] : [node.id, ...collectNodeIds(node.children as (Node | Leaf)[])]);
}

const MOCK_BASE_TOTAL = MOCK.flatMap(collectLeaves).reduce((sum, leaf) => sum + leaf.base, 0);

type ColunaKey = "vinculo" | "ldo" | "base" | "ajuste" | "proposta" | "delta" | "share";
const COLUNAS: { key: ColunaKey; label: string }[] = [
  { key: "vinculo", label: "Vínculo" },
  { key: "ldo", label: "LDO" },
  { key: "base", label: "LOA Base" },
  { key: "ajuste", label: "Ajuste (+/−)" },
  { key: "proposta", label: "LOA Proposta" },
  { key: "delta", label: "Δ vs LDO" },
  { key: "share", label: "% total" },
];

type Props = {
  deficitBase: number | null; // LOA Receita − LOA Despesa Proposta antes dos ajustes
  onAjusteTotalChange: (total: number) => void;
};

export function DetalhamentoProposta({ deficitBase, onAjusteTotalChange }: Props) {
  const [ajustes, setAjustes] = useState<Record<string, Ajuste>>({});
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([MOCK[0].id]));
  const [lote, setLote] = useState<Node | null>(null);
  const [editando, setEditando] = useState<Leaf | null>(null);
  const [ocultas, setOcultas] = useState<Set<ColunaKey>>(new Set());
  const [menuColunas, setMenuColunas] = useState(false);
  const show = (key: ColunaKey) => !ocultas.has(key);
  const toggleColuna = (key: ColunaKey) => setOcultas((current) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const totals = useMemo(() => {
    const map = new Map<string, { ldo: number; base: number; ajuste: number }>();
    const walk = (item: Node | Leaf): { ldo: number; base: number; ajuste: number } => {
      const value = isLeaf(item)
        ? { ldo: item.ldo, base: item.base, ajuste: ajustes[item.id]?.valor ?? 0 }
        : (item.children as (Node | Leaf)[]).map(walk).reduce((a, b) => ({ ldo: a.ldo + b.ldo, base: a.base + b.base, ajuste: a.ajuste + b.ajuste }), { ldo: 0, base: 0, ajuste: 0 });
      map.set(item.id, value);
      return value;
    };
    const grand = MOCK.map(walk).reduce((a, b) => ({ ldo: a.ldo + b.ldo, base: a.base + b.base, ajuste: a.ajuste + b.ajuste }), { ldo: 0, base: 0, ajuste: 0 });
    return { map, grand };
  }, [ajustes]);

  const applyAjustes = (next: Record<string, Ajuste>) => {
    setAjustes(next);
    onAjusteTotalChange(Object.values(next).reduce((sum, item) => sum + item.valor, 0));
  };

  const toggle = (id: string) => setExpanded((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const deficitAtual = deficitBase === null ? null : deficitBase - totals.grand.ajuste;
  const ajustesFeitos = Object.keys(ajustes).length;

  const renderRow = (item: Node | Leaf, depth: number): React.ReactNode => {
    const t = totals.map.get(item.id)!;
    const proposta = t.base + t.ajuste;
    const deltaLdo = proposta - t.ldo;
    const share = totals.grand.base + totals.grand.ajuste ? proposta / (totals.grand.base + totals.grand.ajuste) : 0;
    const leaf = isLeaf(item);
    const open = !leaf && expanded.has(item.id);
    const rowTone = leaf ? "bg-surface" : depth === 0 ? "bg-surface-container font-bold" : depth === 1 ? "bg-surface-container-low font-semibold" : "bg-surface font-semibold";

    return (
      <Fragment key={item.id}>
        <tr className={`border-b border-outline-variant/50 ${rowTone}`}>
          <td className="p-2 text-left">
            <div className="flex items-start gap-1" style={{ paddingLeft: depth * 16 }}>
              {leaf ? (
                <span aria-hidden="true" className="material-symbols-outlined text-[16px] w-5 text-on-surface-variant" title={item.travado ? `Travado: ${item.motivoTrava}` : undefined}>{item.travado ? "lock" : "subdirectory_arrow_right"}</span>
              ) : (
                <button type="button" onClick={() => toggle(item.id)} aria-expanded={open} aria-label={`${open ? "Recolher" : "Expandir"} ${item.nome}`} className="material-symbols-outlined text-[18px] w-5 text-on-surface-variant hover:text-primary">{open ? "expand_more" : "chevron_right"}</button>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1">
                  <span className={`shrink-0 rounded px-1.5 text-[9px] font-bold uppercase tracking-wider ${leaf ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant"}`}>{leaf ? "Subelemento" : NIVEL_LABEL[item.nivel]}</span>
                  <span className={leaf ? "text-xs" : "text-sm"}>{item.nome}</span>
                  {leaf && item.travado && <span className="ml-1 rounded-full border border-outline-variant px-1.5 text-[10px] text-on-surface-variant">{item.motivoTrava}</span>}
                  {leaf && ajustes[item.id]?.justificativa && <span className="material-symbols-outlined text-[14px] text-primary" title={ajustes[item.id].justificativa}>chat</span>}
                </div>
                {leaf && item.obs && <p className="mt-0.5 text-[11px] italic text-on-surface-variant"><span className="font-semibold not-italic">Obs:</span> {item.obs}</p>}
              </div>
            </div>
          </td>
          {show("vinculo") && <td className="p-2 text-left font-mono text-xs whitespace-nowrap">{leaf ? item.vinculo : ""}</td>}
          {show("ldo") && <td className="p-2 text-right tabular-nums text-xs">{currency.format(t.ldo)}</td>}
          {show("base") && <td className="p-2 text-right tabular-nums text-xs text-on-surface-variant">{currency.format(t.base)}</td>}
          {show("ajuste") && <td className="p-2 text-right tabular-nums text-xs">
            {leaf ? (
              <button type="button" disabled={item.travado} onClick={() => setEditando(item)} className={`min-w-28 rounded border px-2 py-1 text-right ${item.travado ? "border-transparent text-on-surface-variant cursor-not-allowed" : "border-outline-variant hover:border-primary"} ${t.ajuste < 0 ? "text-red-700" : t.ajuste > 0 ? "text-green-700" : ""}`}>
                {t.ajuste ? currency.format(t.ajuste) : "—"}
              </button>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <span className={t.ajuste < 0 ? "text-red-700" : t.ajuste > 0 ? "text-green-700" : ""}>{t.ajuste ? currency.format(t.ajuste) : "—"}</span>
                <button type="button" onClick={() => setLote(item)} title="Ajuste em lote" aria-label={`Ajuste em lote em ${item.nome}`} className="material-symbols-outlined text-[16px] text-primary hover:bg-primary/10 rounded">tune</button>
              </div>
            )}
          </td>}
          {show("proposta") && <td className="p-2 text-right tabular-nums text-xs font-bold">{currency.format(proposta)}</td>}
          {show("delta") && <td className={`p-2 text-right tabular-nums text-xs ${deltaLdo > 0 ? "text-amber-700" : "text-on-surface-variant"}`}>{deltaLdo > 0 ? "+" : ""}{currency.format(deltaLdo)}</td>}
          {show("share") && <td className="p-2 text-right tabular-nums text-xs text-on-surface-variant">{percent.format(share)}</td>}
        </tr>
        {open && (item.children as (Node | Leaf)[]).map((child) => renderRow(child, depth + 1))}
      </Fragment>
    );
  };

  return (
    <section aria-labelledby="detalhamento-proposta-title" className="panel bg-surface border border-outline-variant overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant p-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="detalhamento-proposta-title" className="text-lg font-bold text-on-surface">Detalhamento da Proposta</h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">Protótipo · dados fictícios</span>
          </div>
          <p className="text-xs text-on-surface-variant">Ajuste a LOA Base para fechar o déficit. A base original nunca é sobrescrita.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <button type="button" onClick={() => setMenuColunas((open) => !open)} aria-expanded={menuColunas} className="flex items-center gap-1 rounded border border-outline-variant px-3 py-1.5 text-xs font-semibold hover:bg-surface-container">
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">view_column</span>
              Colunas{ocultas.size ? ` (${COLUNAS.length - ocultas.size}/${COLUNAS.length})` : ""}
            </button>
            {menuColunas && (
              <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-outline-variant bg-surface p-2 shadow-lg" onMouseLeave={() => setMenuColunas(false)}>
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Exibir colunas</p>
                {COLUNAS.map((coluna) => (
                  <label key={coluna.key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-surface-container">
                    <input type="checkbox" checked={show(coluna.key)} onChange={() => toggleColuna(coluna.key)} className="accent-primary" />
                    {coluna.label}
                  </label>
                ))}
                <div className="mt-1 flex justify-between border-t border-outline-variant px-2 pt-2 text-[11px] font-semibold">
                  <button type="button" onClick={() => setOcultas(new Set())} className="text-primary hover:underline">Mostrar todas</button>
                  <button type="button" onClick={() => setOcultas(new Set(COLUNAS.map((coluna) => coluna.key).filter((key) => key !== "proposta")))} className="text-on-surface-variant hover:underline">Só LOA Proposta</button>
                </div>
              </div>
            )}
          </div>
          <button type="button" onClick={() => setExpanded(new Set(collectNodeIds(MOCK)))} className="rounded border border-outline-variant px-3 py-1.5 text-xs font-semibold hover:bg-surface-container">Expandir tudo</button>
          <button type="button" onClick={() => setExpanded(new Set())} className="rounded border border-outline-variant px-3 py-1.5 text-xs font-semibold hover:bg-surface-container">Recolher</button>
          <button type="button" disabled={!ajustesFeitos} onClick={() => applyAjustes({})} className="rounded border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40">Desfazer ajustes</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-surface-container-high text-[11px] uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th className="p-2 text-left">Secretaria / Função-Subfunção / Programa / Ação / Natureza / Subelemento</th>
              {COLUNAS.filter((coluna) => show(coluna.key)).map((coluna) => (
                <th key={coluna.key} className={`p-2 ${coluna.key === "vinculo" ? "text-left" : "text-right"}`}>{coluna.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>{MOCK.map((item) => renderRow(item, 0))}</tbody>
        </table>
      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant bg-[#001a4b] px-4 py-3 text-white">
        <div className="flex flex-wrap gap-6 text-xs">
          <span>Ajustes: <strong>{ajustesFeitos}</strong></span>
          <span>Total ajustado: <strong className={totals.grand.ajuste < 0 ? "text-red-300" : "text-green-300"}>{currency.format(totals.grand.ajuste)}</strong></span>
          <span>LOA Proposta (amostra): <strong>{currency.format(MOCK_BASE_TOTAL + totals.grand.ajuste)}</strong></span>
        </div>
        <div className="text-sm">
          {deficitAtual === null ? <span className="text-white/70">Déficit indisponível (importe a LOA Receitas)</span>
            : deficitAtual < 0 ? <span>Faltam <strong className="text-red-300">{currency.format(-deficitAtual)}</strong> para equilibrar</span>
            : <span className="text-green-300 font-bold">Orçamento equilibrado ✓</span>}
        </div>
      </div>

      {editando && (
        <AjusteDialog
          titulo={editando.nome}
          base={editando.base}
          atual={ajustes[editando.id]}
          onClose={() => setEditando(null)}
          onSave={(ajuste) => {
            const next = { ...ajustes };
            if (ajuste.valor === 0) delete next[editando.id]; else next[editando.id] = ajuste;
            applyAjustes(next);
            setEditando(null);
          }}
        />
      )}

      {lote && (
        <LoteDialog
          node={lote}
          onClose={() => setLote(null)}
          onApply={(percentual, justificativa) => {
            const next = { ...ajustes };
            collectLeaves(lote).filter((leaf) => !leaf.travado).forEach((leaf) => {
              next[leaf.id] = { valor: Math.round(leaf.base * percentual) / 100, justificativa };
            });
            applyAjustes(next);
            setLote(null);
          }}
        />
      )}
    </section>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
      <div className="w-full max-w-md rounded-xl bg-surface p-5 shadow-xl">
        <h3 className="mb-3 font-bold text-on-surface">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function AjusteDialog({ titulo, base, atual, onClose, onSave }: { titulo: string; base: number; atual?: Ajuste; onClose: () => void; onSave: (ajuste: Ajuste) => void }) {
  const [modo, setModo] = useState<"valor" | "percentual">("valor");
  const [entrada, setEntrada] = useState(atual ? String(atual.valor) : "");
  const [justificativa, setJustificativa] = useState(atual?.justificativa ?? "");
  const numero = Number(entrada.replace(",", ".")) || 0;
  const valor = modo === "valor" ? numero : Math.round(base * numero) / 100;
  const podeSalvar = valor === 0 || justificativa.trim().length >= 5;

  return (
    <Modal title={`Ajustar: ${titulo}`} onClose={onClose}>
      <p className="text-xs text-on-surface-variant">LOA Base: <strong>{currency.format(base)}</strong></p>
      <div className="mt-3 flex gap-2 text-xs">
        {(["valor", "percentual"] as const).map((item) => (
          <button key={item} type="button" onClick={() => setModo(item)} className={`rounded px-3 py-1 font-semibold ${modo === item ? "bg-primary text-on-primary" : "border border-outline-variant"}`}>{item === "valor" ? "R$" : "%"}</button>
        ))}
      </div>
      <label className="mt-3 block text-xs font-semibold">Ajuste ({modo === "valor" ? "R$, negativo para cortar" : "%, negativo para cortar"})
        <input autoFocus value={entrada} onChange={(event) => setEntrada(event.target.value)} inputMode="decimal" className="mt-1 w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm" placeholder={modo === "valor" ? "-1000000" : "-5"} />
      </label>
      <p className="mt-2 text-xs">Nova LOA Proposta: <strong>{currency.format(base + valor)}</strong> <span className={valor < 0 ? "text-red-700" : "text-green-700"}>({currency.format(valor)})</span></p>
      <label className="mt-3 block text-xs font-semibold">Justificativa (obrigatória)
        <textarea value={justificativa} onChange={(event) => setJustificativa(event.target.value)} rows={3} className="mt-1 w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm" />
      </label>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded border border-outline-variant px-3 py-1.5 text-xs font-semibold">Cancelar</button>
        <button type="button" disabled={!podeSalvar} onClick={() => onSave({ valor, justificativa: justificativa.trim() })} className="rounded bg-primary px-3 py-1.5 text-xs font-bold text-on-primary disabled:opacity-40">Salvar ajuste</button>
      </div>
    </Modal>
  );
}

function LoteDialog({ node, onClose, onApply }: { node: Node; onClose: () => void; onApply: (percentual: number, justificativa: string) => void }) {
  const [entrada, setEntrada] = useState("-5");
  const [justificativa, setJustificativa] = useState("");
  const leaves = collectLeaves(node);
  const editaveis = leaves.filter((leaf) => !leaf.travado);
  const percentual = Number(entrada.replace(",", ".")) || 0;
  const impacto = editaveis.reduce((sum, leaf) => sum + Math.round(leaf.base * percentual) / 100, 0);

  return (
    <Modal title={`Ajuste em lote: ${node.nome}`} onClose={onClose}>
      <p className="text-xs text-on-surface-variant">{editaveis.length} de {leaves.length} linhas serão ajustadas. Linhas travadas (pessoal, contratos iniciados) são ignoradas. Substitui ajustes anteriores dessas linhas.</p>
      <label className="mt-3 block text-xs font-semibold">Percentual sobre a LOA Base
        <input autoFocus value={entrada} onChange={(event) => setEntrada(event.target.value)} inputMode="decimal" className="mt-1 w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm" />
      </label>
      <p className="mt-2 text-xs">Impacto: <strong className={impacto < 0 ? "text-red-700" : "text-green-700"}>{currency.format(impacto)}</strong></p>
      <label className="mt-3 block text-xs font-semibold">Justificativa (obrigatória)
        <textarea value={justificativa} onChange={(event) => setJustificativa(event.target.value)} rows={3} className="mt-1 w-full rounded border border-outline-variant bg-surface px-3 py-2 text-sm" />
      </label>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded border border-outline-variant px-3 py-1.5 text-xs font-semibold">Cancelar</button>
        <button type="button" disabled={justificativa.trim().length < 5 || !percentual} onClick={() => onApply(percentual, justificativa.trim())} className="rounded bg-primary px-3 py-1.5 text-xs font-bold text-on-primary disabled:opacity-40">Aplicar</button>
      </div>
    </Modal>
  );
}
