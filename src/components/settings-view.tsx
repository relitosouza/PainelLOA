export function SettingsView() {
  return (
    <>
      <header className="page-heading border-b border-outline-variant/30 pb-4 mb-6">
        <div>
          <p className="eyebrow font-bold uppercase text-on-surface-variant tracking-wider text-[11px]">Administração</p>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Painel Administrativo - Configurações</h1>
          <p className="text-on-surface-variant mt-1">Identidade visual e parâmetros gerais do Visualizador da LOA.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Visual Identity Section */}
        <section className="lg:col-span-8 panel p-6 bg-surface">
          <h2 className="text-md font-bold text-on-surface mb-2">Identidade da Prefeitura</h2>
          <p className="text-xs text-on-surface-variant mb-6">Configure o Brasão Oficial e a paleta de cores corporativa do município.</p>

          <div className="space-y-6">
            {/* Coat of Arms Upload */}
            <div className="border border-outline-variant rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm bg-surface">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 border border-outline-variant bg-surface-container flex items-center justify-center font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant rounded-lg">
                  Brasão
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Logotipo / Brasão Municipal</h3>
                  <p className="text-xs text-on-surface-variant">Formatos aceitos: SVG ou PNG de alta resolução.</p>
                </div>
              </div>
              <button className="brutalist-button bg-surface text-on-surface hover:bg-surface-container font-semibold text-xs shrink-0 border border-outline-variant">
                Enviar Arquivo
              </button>
            </div>

            {/* Colors Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-outline-variant rounded-xl p-4 bg-surface shadow-sm">
                <label className="text-xs font-bold text-on-surface tracking-wider block mb-2">Cor Principal</label>
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 border border-outline-variant rounded" style={{ backgroundColor: "#181c22" }} />
                  <input type="text" defaultValue="#181c22" className="brutalist-input text-xs py-1.5 font-mono" />
                </div>
              </div>
              <div className="border border-outline-variant rounded-xl p-4 bg-surface shadow-sm">
                <label className="text-xs font-bold text-on-surface tracking-wider block mb-2">Cor de Destaque (Accent)</label>
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 border border-outline-variant rounded" style={{ backgroundColor: "#005ab4" }} />
                  <input type="text" defaultValue="#005ab4" className="brutalist-input text-xs py-1.5 font-mono" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
              <button className="brutalist-button bg-surface text-on-surface hover:bg-surface-container font-semibold text-xs border border-outline-variant">
                Restaurar Padrão
              </button>
              <button className="brutalist-button brutalist-button-primary bg-tertiary text-on-tertiary hover:bg-tertiary-container font-semibold text-xs border-0">
                Salvar Alterações
              </button>
            </div>
          </div>
        </section>

        {/* Database Status Panel */}
        <aside className="lg:col-span-4 panel bg-surface-bright p-6">
          <h2 className="text-md font-bold text-on-surface mb-4">Status do Painel</h2>
          
          <div className="space-y-4">
            <div className="border border-outline-variant p-3 bg-surface flex justify-between items-center text-xs rounded-xl shadow-sm">
              <span className="font-semibold text-on-surface">Conexão BD</span>
              <span className="font-semibold text-green-800 bg-green-100 px-2 py-0.5 rounded-full">Ativo</span>
            </div>
            
            <div className="border border-outline-variant p-3 bg-surface flex justify-between items-center text-xs rounded-xl shadow-sm">
              <span className="font-semibold text-on-surface">Último Sync</span>
              <span className="font-mono font-semibold text-on-surface-variant">30/06/2026 10:24</span>
            </div>

            <div className="border border-outline-variant p-3 bg-surface flex justify-between items-center text-xs rounded-xl shadow-sm">
              <span className="font-semibold text-on-surface">Versão API</span>
              <span className="font-mono font-semibold text-on-surface-variant">v1.2.0</span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

