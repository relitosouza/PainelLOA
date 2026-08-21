"use client";

import { useMemo } from "react";

function compactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function LdoDeliveryMatrix() {
  const priorities = useMemo(() => {
    return [
      {
        priority: "Educação",
        previstoLdo: 1_850_000_000,
        loa2027: 2_120_000_000,
        coveragePct: 114.6,
      },
      {
        priority: "Saúde",
        previstoLdo: 1_350_000_000,
        loa2027: 1_410_000_000,
        coveragePct: 104.4,
      },
      {
        priority: "Infraestrutura Urbana e Obras",
        previstoLdo: 780_000_000,
        loa2027: 853_000_000,
        coveragePct: 109.4,
      },
      {
        priority: "Desenvolvimento Social e Cidadania",
        previstoLdo: 310_000_000,
        loa2027: 326_000_000,
        coveragePct: 105.2,
      },
      {
        priority: "Mobilidade Urbana e Transportes",
        previstoLdo: 420_000_000,
        loa2027: 360_000_000,
        coveragePct: 85.7,
      },
    ];
  }, []);

  const totalPrevisto = priorities.reduce((sum, p) => sum + p.previstoLdo, 0);
  const totalLoaPrev = priorities.reduce((sum, p) => sum + p.loa2027, 0);
  const totalCoverage = (totalLoaPrev / totalPrevisto) * 100;

  return (
    <div className="p-7 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-headline font-black text-lg text-on-surface">O orçamento entrega o Plano de Governo?</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Aderência e cobertura das prioridades da LDO na LOA 2027</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse font-sans">
          <thead>
            <tr className="border-b border-outline-variant/40 text-on-surface-variant font-bold text-[10px] uppercase">
              <th className="pb-2.5">Prioridade</th>
              <th className="pb-2.5 text-right font-mono">Previsto LDO</th>
              <th className="pb-2.5 text-right font-mono">LOA 2027</th>
              <th className="pb-2.5 text-center font-mono">Execução do Plano</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {priorities.map((row) => {
              const isFull = row.coveragePct >= 100;
              const isAlert = row.coveragePct < 90;
              const barColor = isFull ? "bg-emerald-600" : isAlert ? "bg-amber-500" : "bg-sky-600";

              return (
                <tr key={row.priority} className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-2.5 font-bold text-on-surface">{row.priority}</td>
                  <td className="py-2.5 text-right font-mono text-on-surface-variant">{compactCurrency(row.previstoLdo)}</td>
                  <td className="py-2.5 text-right font-mono font-bold text-on-surface">{compactCurrency(row.loa2027)}</td>
                  <td className="py-2.5 text-center font-mono">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`font-bold ${isFull ? "text-emerald-700" : isAlert ? "text-amber-700" : "text-sky-700"}`}>
                        {row.coveragePct.toFixed(0)}%
                      </span>
                      <div className="w-16 h-2 bg-surface-container rounded-full overflow-hidden hidden sm:block">
                        <div
                          className={`h-full ${barColor} rounded-full`}
                          style={{ width: `${Math.min(100, row.coveragePct)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-outline-variant/50 font-bold bg-surface-container-low/40">
              <td className="py-2.5 text-on-surface uppercase text-[11px]">Total das Prioridades</td>
              <td className="py-2.5 text-right font-mono text-on-surface">{compactCurrency(totalPrevisto)}</td>
              <td className="py-2.5 text-right font-mono text-primary font-black">{compactCurrency(totalLoaPrev)}</td>
              <td className="py-2.5 text-center font-mono font-black text-emerald-700">
                {totalCoverage.toFixed(0)}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export function InsufficientLdoGoalsCard() {
  const goals = [
    {
      goal: "Construir 3 UBS",
      organ: "Saúde",
      programAction: "Atenção Primária / UBS Mais Perto",
      physicalGoal: "3 unidades",
      deficit: 42_000_000,
    },
    {
      goal: "Implantar 4 Escolas",
      organ: "Educação",
      programAction: "Escola do Futuro / Modernização",
      physicalGoal: "4 unidades",
      deficit: 35_500_000,
    },
    {
      goal: "Pavimentar 50 km",
      organ: "Serviços e Obras",
      programAction: "Cidade em Obras / Asfalto Novo",
      physicalGoal: "50 km",
      deficit: 28_300_000,
    },
    {
      goal: "Ampliar CRAS",
      organ: "Assistência Social",
      programAction: "Família Protegida / Proteção Básica",
      physicalGoal: "2 centros",
      deficit: 7_100_000,
    },
  ];

  const totalDeficit = goals.reduce((sum, g) => sum + g.deficit, 0);

  return (
    <div className="p-7 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-headline font-black text-lg text-on-surface">Metas da LDO sem Cobertura Suficiente</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Ações onde o custo físico planejado supera a dotação LOA</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse font-sans">
          <thead>
            <tr className="border-b border-outline-variant/40 text-on-surface-variant font-bold text-[10px] uppercase">
              <th className="pb-2">Meta Física</th>
              <th className="pb-2">Secretaria</th>
              <th className="pb-2 text-right font-mono">Déficit Estimado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {goals.map((g) => (
              <tr key={g.goal} className="hover:bg-surface-container-low/60 transition-colors">
                <td className="py-2.5 font-bold text-on-surface">
                  {g.goal}
                  <span className="block text-[10px] text-on-surface-variant font-normal">{g.physicalGoal}</span>
                </td>
                <td className="py-2.5 text-on-surface-variant font-medium">{g.organ}</td>
                <td className="py-2.5 text-right font-mono font-bold text-rose-600">
                  {compactCurrency(g.deficit)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-outline-variant/50 font-bold bg-surface-container-low/40">
              <td className="py-2 text-on-surface uppercase text-[11px]" colSpan={2}>Déficit Total Acumulado</td>
              <td className="py-2 text-right font-mono text-rose-700 font-black">
                {compactCurrency(totalDeficit)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export function StrategicProgramsCard() {
  const [showAll, setShowAll] = useState(false);

  const programs = [
    { code: "1009", name: "Urbanização de Favelas e Habitação", organ: "Habitação", invest: 175_000_000, share: 12.3, actions: 8 },
    { code: "0015", name: "Atenção e Cuidado em Saúde", organ: "Saúde", invest: 284_200_000, share: 20.0, actions: 14 },
    { code: "0008", name: "Educação de Qualidade e Futuro", organ: "Educação", invest: 320_000_000, share: 22.5, actions: 19 },
    { code: "0022", name: "Mobilidade Urbana Integrada", organ: "Transportes", invest: 150_000_000, share: 10.5, actions: 7 },
    { code: "0028", name: "Cidade Sustentável e Limpa", organ: "Meio Ambiente", invest: 95_000_000, share: 6.7, actions: 5 },
  ];

  return (
    <div className="p-7 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-headline font-black text-lg text-on-surface">Programas Estratégicos 2027</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Maiores carteiras de projetos prioritários</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse font-sans">
          <thead>
            <tr className="border-b border-outline-variant/40 text-on-surface-variant font-bold text-[10px] uppercase">
              <th className="pb-2">Programa</th>
              <th className="pb-2">Secretaria</th>
              <th className="pb-2 text-right font-mono">Investimento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {programs.map((p) => (
              <tr key={p.code} className="hover:bg-surface-container-low/60 transition-colors">
                <td className="py-2.5 font-bold text-on-surface">
                  <span className="text-primary font-mono text-[11px] block">{p.code}</span>
                  {p.name}
                </td>
                <td className="py-2.5 text-on-surface-variant font-medium">{p.organ}</td>
                <td className="py-2.5 text-right font-mono font-bold text-on-surface">
                  {compactCurrency(p.invest)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-3 border-t border-outline-variant/30 flex justify-between items-center">
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
        >
          Ver todos os programas estratégicos
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </button>
      </div>

      {showAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-surface border border-outline-variant rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant/40 pb-3">
              <h4 className="text-base font-headline font-black text-on-surface">
                Programas Estratégicos Cadastrados
              </h4>
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {programs.map((p) => (
                <div key={p.code} className="p-3 bg-surface-container-low rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-on-surface block">{p.code} — {p.name}</span>
                    <span className="text-on-surface-variant text-[11px]">{p.organ} · {p.actions} Ações</span>
                  </div>
                  <span className="font-mono font-bold text-primary">{compactCurrency(p.invest)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
