"use client";

import { useState, useMemo } from "react";
import { percent } from "@/lib/format";

function compactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function BudgetScenarioSimulator({
  baseTotal,
}: {
  baseTotal: number;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  // Parâmetros do Simulador Customizado
  const [customOwnRevPct, setCustomOwnRevPct] = useState(0);       // -10 a +10
  const [customTransfPct, setCustomTransfPct] = useState(0);       // -10 a +10
  const [customPersonnelPct, setCustomPersonnelPct] = useState(0); // -10 a +10
  const [customCusteioPct, setCustomCusteioPct] = useState(0);     // -10 a +10
  const [customInvestPct, setCustomInvestPct] = useState(0);       // -10 a +10

  const total = baseTotal > 0 ? baseTotal : 6_500_000_000;

  // 1. Cenário Otimista (+5% receita)
  const optRev = total * 1.05;
  const optExp = total;
  const optResult = optRev - optExp;

  // 2. Cenário Base LOA
  const baseRev = total;
  const baseExp = total;
  const baseResult = 0;

  // 3. Cenário Conservador (-5% receita)
  const consRev = total * 0.95;
  const consExp = total;
  const consResult = consRev - consExp;

  // 4. Cenário Personalizado
  const customCalcs = useMemo(() => {
    const ownBase = total * 0.415;
    const transfBase = total * 0.585;
    const persBase = total * 0.352;
    const custBase = total * 0.450;
    const invBase = total * 0.198;

    const simOwn = ownBase * (1 + customOwnRevPct / 100);
    const simTransf = transfBase * (1 + customTransfPct / 100);
    const simTotalRev = simOwn + simTransf;

    const simPers = persBase * (1 + customPersonnelPct / 100);
    const simCust = custBase * (1 + customCusteioPct / 100);
    const simInv = invBase * (1 + customInvestPct / 100);
    const simTotalExp = simPers + simCust + simInv;

    const result = simTotalRev - simTotalExp;
    return {
      simTotalRev,
      simTotalExp,
      result,
      simInv,
    };
  }, [total, customOwnRevPct, customTransfPct, customPersonnelPct, customCusteioPct, customInvestPct]);

  const handleReset = () => {
    setCustomOwnRevPct(0);
    setCustomTransfPct(0);
    setCustomPersonnelPct(0);
    setCustomCusteioPct(0);
    setCustomInvestPct(0);
  };

  return (
    <div className="p-7 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-headline font-black text-lg text-on-surface">Cenários de Receita 2027</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Testes de sensibilidade fiscal para tomada de decisão</p>
        </div>
      </div>

      {/* Tabela dos 3 Cenários Padrão */}
      <div className="overflow-x-auto my-1">
        <table className="w-full text-xs font-sans border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/40 text-on-surface-variant font-bold text-[10px] uppercase">
              <th className="pb-2 text-left">Cenário</th>
              <th className="pb-2 text-right font-mono">Receita Total</th>
              <th className="pb-2 text-right font-mono">Resultado Projetado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20 font-medium">
            <tr className="hover:bg-surface-container-low/50">
              <td className="py-2.5 font-bold text-emerald-700">Otimista (+5%)</td>
              <td className="py-2.5 text-right font-mono text-on-surface">{compactCurrency(optRev)}</td>
              <td className="py-2.5 text-right font-mono font-bold text-emerald-700">
                Superávit {compactCurrency(optResult)}
              </td>
            </tr>
            <tr className="hover:bg-surface-container-low/50 bg-surface-container-lowest">
              <td className="py-2.5 font-bold text-on-surface">LOA (Base)</td>
              <td className="py-2.5 text-right font-mono text-on-surface">{compactCurrency(baseRev)}</td>
              <td className="py-2.5 text-right font-mono font-bold text-on-surface-variant">
                Equilibrado
              </td>
            </tr>
            <tr className="hover:bg-surface-container-low/50">
              <td className="py-2.5 font-bold text-rose-700">Conservador (-5%)</td>
              <td className="py-2.5 text-right font-mono text-on-surface">{compactCurrency(consRev)}</td>
              <td className="py-2.5 text-right font-mono font-bold text-rose-700">
                Déficit {compactCurrency(Math.abs(consResult))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Botão para abrir modal de simulação */}
      <div className="mt-4 pt-3 border-t border-outline-variant/30 flex justify-between items-center">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-tertiary/10 text-tertiary font-bold text-xs hover:bg-tertiary hover:text-white transition-all shadow-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">tune</span>
          Simular novo cenário
        </button>

        <span className="text-[11px] text-on-surface-variant font-medium">
          Apenas camada analítica
        </span>
      </div>

      {/* MODAL DE SIMULAÇÃO AVANÇADA */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-surface border border-outline-variant rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-start border-b border-outline-variant/40 pb-4">
              <div>
                <h4 className="text-lg font-headline font-black text-on-surface">Simulador de Cenários Fiscais</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">Altere as premissas para testar o equilíbrio das contas públicas</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Sliders de Variáveis */}
            <div className="space-y-4 text-xs font-semibold text-on-surface">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Receita Própria (IPTU, ISS, Taxas):</span>
                  <span className="font-mono font-bold text-primary">{customOwnRevPct > 0 ? `+${customOwnRevPct}%` : `${customOwnRevPct}%`}</span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="1"
                  value={customOwnRevPct}
                  onChange={(e) => setCustomOwnRevPct(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Transferências (FPM, ICMS, SUS, FUNDEB):</span>
                  <span className="font-mono font-bold text-primary">{customTransfPct > 0 ? `+${customTransfPct}%` : `${customTransfPct}%`}</span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="1"
                  value={customTransfPct}
                  onChange={(e) => setCustomTransfPct(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Pessoal e Encargos Sociais (Folha):</span>
                  <span className="font-mono font-bold text-primary">{customPersonnelPct > 0 ? `+${customPersonnelPct}%` : `${customPersonnelPct}%`}</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="15"
                  step="1"
                  value={customPersonnelPct}
                  onChange={(e) => setCustomPersonnelPct(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Custeio / Manutenção da Máquina:</span>
                  <span className="font-mono font-bold text-primary">{customCusteioPct > 0 ? `+${customCusteioPct}%` : `${customCusteioPct}%`}</span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="1"
                  value={customCusteioPct}
                  onChange={(e) => setCustomCusteioPct(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
            </div>

            {/* Resultado da Simulação */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-2 font-mono">
              <div className="flex justify-between text-xs font-bold text-on-surface">
                <span>Receita Simulada:</span>
                <span>{compactCurrency(customCalcs.simTotalRev)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-on-surface">
                <span>Despesa Simulada:</span>
                <span>{compactCurrency(customCalcs.simTotalExp)}</span>
              </div>
              <div className="pt-2 border-t border-outline-variant/30 flex justify-between text-sm font-black">
                <span>Resultado Projetado:</span>
                <span className={customCalcs.result >= 0 ? "text-emerald-600" : "text-rose-600"}>
                  {customCalcs.result >= 0 ? `Superávit ${compactCurrency(customCalcs.result)}` : `Déficit ${compactCurrency(Math.abs(customCalcs.result))}`}
                </span>
              </div>
            </div>

            {/* Ações do Modal */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                Restaurar cenário LOA
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-md cursor-pointer"
              >
                Aplicar na Visão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
