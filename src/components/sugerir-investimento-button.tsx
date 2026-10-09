"use client";

import { useState } from "react";
import { SugerirInvestimentoModal } from "@/components/sugerir-investimento-modal";

type SugerirInvestimentoButtonProps = {
  areasDisponiveis?: { key: string; label: string }[];
};

export function SugerirInvestimentoButton({ areasDisponiveis }: SugerirInvestimentoButtonProps) {
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalAberto(true)}
        className="flex items-center justify-center gap-3 bg-secondary text-on-secondary px-10 py-5 rounded-2xl font-label-md text-lg hover:scale-105 transition-soft shadow-lg cursor-pointer"
      >
        <span className="material-symbols-outlined">add_circle</span>
        Sugerir Investimento
      </button>

      <SugerirInvestimentoModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        areasDisponiveis={areasDisponiveis}
      />
    </>
  );
}
