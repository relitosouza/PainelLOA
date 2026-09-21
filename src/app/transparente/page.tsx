import Link from "next/link";
import Image from "next/image";
import { currency, integer } from "@/lib/format";
import { AREAS_TRANSPARENTE } from "@/lib/transparente-areas";
import { getTransparenteResumo, type TransparenteResumo } from "@/lib/transparente-resumo.server";
import { ScrollReveal } from "./scroll-reveal";

const EXERCICIO = "2027";

function formatCompact(valor: number) {
  if (valor >= 1e9) return `R$ ${(valor / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} Bi`;
  if (valor >= 1e6) return `R$ ${(valor / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} Mi`;
  return currency.format(valor);
}

function formatPercent(valor: number) {
  return `${valor.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export default async function TransparentePage() {
  let carregado: TransparenteResumo | null = null;
  try {
    carregado = await getTransparenteResumo();
  } catch (error) {
    console.error("Não foi possível carregar o resumo do Orçamento Transparente:", error);
  }
  const resumo = carregado;

  const areas = resumo
    ? AREAS_TRANSPARENTE.map((area) => ({
        ...area,
        ...(resumo.porArea.find((item) => item.key === area.key) ?? { valor: 0, percentual: 0 }),
      })).filter((area) => area.valor > 0)
    : [];

  const destaques = areas.filter((area) => area.destaque);
  const outrasPct = Math.max(0, 100 - destaques.reduce((soma, area) => soma + area.percentual, 0));

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            display: inline-block;
            vertical-align: middle;
        }
        .transition-soft { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .hero-gradient { background: linear-gradient(180deg, rgba(247, 249, 251, 0.8) 0%, rgba(247, 249, 251, 1) 100%); }
        .animate-in {
            animation: fade-in-up 0.8s ease-out forwards;
        }
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-in-target { opacity: 0; }
      `}} />

      <ScrollReveal />

      <div className="bg-background font-body-md text-on-background selection:bg-primary-fixed-dim" style={{ fontFamily: "Inter, sans-serif" }}>
        {/* TopNavBar */}
        <header className="bg-surface-container-lowest sticky top-0 z-50 shadow-sm">
          <nav className="flex justify-between items-center w-full px-margin-desktop max-w-container-max mx-auto h-20">
            <Link href="/" className="font-headline-md text-headline-md font-bold text-primary cursor-pointer hover:opacity-80">Orçamento Transparente</Link>
            <div className="hidden md:flex items-center space-x-8 font-body-md text-body-md">
              <Link href="/" className="text-on-surface-variant hover:text-primary transition-colors">
                Visão Analítica
              </Link>
            </div>
          </nav>
        </header>

        <main>
          {/* Hero Section */}
          <section className="relative min-h-[600px] flex items-center overflow-hidden">
            <div className="absolute inset-0 z-0">
              <Image
                className="w-full h-full object-cover"
                alt="A wide panoramic photograph of Osasco, Brazil"
                fill
                priority
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRJUoFmAKsZLZsk0IuNN37qjGMZvQJn2NxWyHh0Ljk-dfxYGbtXqtYSq8gclSqJhFTc4dMxhNedyofCfuSw_YfGwjHq1_0r0EL6pM89Pdhx1v_aVjuRjfplHBbrL8fXMHFMxa9bmi9yF6vkzULY2WnwwxoYwHdTPql3YFlZROk0YHADYtAyEGPvKYdAocajiSYMbbNiutOUu0bxtgKIEW5uIkR27ADvRNfs77siRYZODjpLgxLd5JIFTweKPE9uJ9u3Q"
              />
              <div className="absolute inset-0 hero-gradient"></div>
            </div>
            <div className="relative z-10 w-full px-margin-desktop max-w-container-max mx-auto py-20">
              <div className="max-w-2xl">
                <h1 className="font-display-lg text-display-lg text-primary mb-6">Orçamento Transparente: O Orçamento de Osasco na palma da sua mão</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant mb-10">Consulte cada real da proposta orçamentária de {EXERCICIO} e acompanhe como os recursos são distribuídos entre as secretarias.</p>
                <Link
                  href="/analise-loa"
                  className="inline-flex items-center gap-2 bg-primary text-on-primary px-8 py-3 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined">query_stats</span>
                  Explorar os dados detalhados
                </Link>
              </div>
            </div>
          </section>

          {!resumo && (
            <section className="py-16 px-margin-desktop max-w-container-max mx-auto">
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex items-start gap-3 max-w-3xl mx-auto shadow-sm">
                <span className="material-symbols-outlined text-primary">error</span>
                <p className="text-body-md text-on-surface-variant">
                  Os dados orçamentários não estão disponíveis no momento. Tente novamente em instantes.
                </p>
              </div>
            </section>
          )}

          {resumo && (
            <>
              {/* Overview Stats */}
              <section className="py-16 bg-surface-container-low">
                <div className="px-margin-desktop max-w-container-max mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
                    {/* Total Budget */}
                    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-soft">
                      <div className="w-12 h-12 bg-primary-fixed rounded-lg flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-primary">payments</span>
                      </div>
                      <p className="text-label-md text-on-surface-variant mb-1">Orçamento Total {EXERCICIO}</p>
                      <h3 className="font-headline-lg text-headline-lg text-primary animate-in-target">{formatCompact(resumo.total)}</h3>
                      <p className="text-label-md text-on-surface-variant mt-2 italic">{currency.format(resumo.total)}</p>
                    </div>
                    {/* Investimentos */}
                    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-soft">
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-emerald-600">engineering</span>
                      </div>
                      <p className="text-label-md text-on-surface-variant mb-1">Investimentos e Inversões</p>
                      <h3 className="font-headline-lg text-headline-lg text-emerald-600 animate-in-target">{formatCompact(resumo.totalInvestimentos)}</h3>
                      <p className="text-label-md text-on-surface-variant mt-2 italic">
                        {formatPercent(resumo.total > 0 ? (resumo.totalInvestimentos / resumo.total) * 100 : 0)} do orçamento
                      </p>
                    </div>
                    {/* Secretarias */}
                    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-soft">
                      <div className="w-12 h-12 bg-secondary-fixed rounded-lg flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-secondary">account_balance</span>
                      </div>
                      <p className="text-label-md text-on-surface-variant mb-1">Órgãos e Secretarias</p>
                      <h3 className="font-headline-lg text-headline-lg text-secondary animate-in-target">{integer.format(resumo.totalSecretarias)}</h3>
                      <p className="text-label-md text-on-surface-variant mt-2 italic">Com dotação prevista</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* How the Budget Impacts Your Life Section */}
              <section className="py-16 bg-surface-container-low border-b border-outline-variant/30">
                <div className="px-margin-desktop max-w-container-max mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="font-headline-lg text-headline-lg text-primary mb-3 animate-in-target">Como o orçamento impacta a sua vida?</h2>
                    <p className="text-body-md text-on-surface-variant max-w-2xl mx-auto">
                      Entenda onde os recursos da Lei Orçamentária Anual (LOA) são aplicados de forma prática e direta no seu dia a dia.
                    </p>
                    <div className="w-24 h-1 bg-secondary mx-auto rounded-full mt-3"></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-10">
                    {areas.map((area) => (
                      <div key={area.key} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-soft flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 ${area.corFundo} rounded-lg flex items-center justify-center shrink-0`}>
                              <span className={`material-symbols-outlined ${area.corTexto}`}>{area.icone}</span>
                            </div>
                            <p className="text-label-md text-on-surface-variant font-semibold">{area.label}</p>
                          </div>
                          <h3 className={`font-headline-lg text-headline-lg ${area.corTexto}`}>{formatCompact(area.valor)}</h3>
                          <p className="text-label-md text-on-surface-variant mt-2 font-semibold">{formatPercent(area.percentual)} da LOA</p>
                        </div>
                        <div className="border-t border-outline-variant/50 pt-4 mt-4">
                          <div className="flex flex-wrap gap-1">
                            {area.tags.map((tag) => (
                              <span key={tag} className="bg-surface-container-low text-on-surface-variant text-[11px] px-2 py-0.5 rounded border border-outline-variant/30">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Disclaimer Banner */}
                  <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex items-start gap-3 max-w-3xl mx-auto shadow-sm">
                    <span className="material-symbols-outlined text-primary">info</span>
                    <div className="text-sm text-on-surface-variant leading-relaxed">
                      <p>
                        <strong>Nota Informativa:</strong> Valores da proposta orçamentária de {EXERCICIO}, consolidados a partir da mesma base dos relatórios analíticos oficiais da Secretaria de Finanças.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Pillars of Transparency */}
              <section className="py-20 px-margin-desktop max-w-container-max mx-auto">
                <div className="text-center mb-16">
                  <h2 className="font-headline-lg text-headline-lg text-primary mb-4">Pilares da Nossa Transparência</h2>
                  <div className="w-24 h-1 bg-secondary mx-auto rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div className="text-center group">
                    <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-fixed transition-soft">
                      <span className="material-symbols-outlined text-primary text-3xl">visibility</span>
                    </div>
                    <h4 className="font-headline-md text-headline-md text-on-surface mb-3">Acesso Livre</h4>
                    <p className="text-body-md text-on-surface-variant">Qualquer cidadão pode acessar todos os dados de receitas e despesas sem necessidade de cadastro.</p>
                  </div>
                  <div className="text-center group">
                    <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-secondary-fixed transition-soft">
                      <span className="material-symbols-outlined text-secondary text-3xl">update</span>
                    </div>
                    <h4 className="font-headline-md text-headline-md text-on-surface mb-3">Mesma Fonte Oficial</h4>
                    <p className="text-body-md text-on-surface-variant">Os números publicados aqui vêm da mesma base que alimenta os relatórios analíticos da Prefeitura.</p>
                  </div>
                  <div className="text-center group">
                    <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-tertiary-fixed transition-soft">
                      <span className="material-symbols-outlined text-tertiary text-3xl">forum</span>
                    </div>
                    <h4 className="font-headline-md text-headline-md text-on-surface mb-3">Voz Ativa</h4>
                    <p className="text-body-md text-on-surface-variant">Não apenas consulte: sugira melhorias e denuncie irregularidades diretamente pelo portal.</p>
                  </div>
                </div>
              </section>

              {/* Interactive Section: Where does R$ 100 go? */}
              <section className="py-20 bg-primary text-on-primary">
                <div className="px-margin-desktop max-w-container-max mx-auto">
                  <div className="flex flex-col lg:flex-row items-center gap-16">
                    <div className="lg:w-1/2">
                      <h2 className="font-display-lg text-display-lg mb-6">Para onde vão cada R$ 100,00 do orçamento?</h2>
                      <p className="font-body-lg text-body-lg opacity-90 mb-8">Entenda de forma visual como os recursos previstos na LOA {EXERCICIO} são distribuídos entre as secretarias e serviços da Prefeitura de Osasco.</p>
                      <Link href="/analise-loa" className="inline-block bg-surface-container-lowest text-primary px-8 py-3 rounded-xl font-label-md hover:bg-primary-fixed transition-soft">
                        Ver Detalhado por Secretaria
                      </Link>
                    </div>
                    <div className="lg:w-1/2 w-full">
                      <div className="space-y-4 bg-surface-container-lowest/10 p-8 rounded-2xl backdrop-blur-md">
                        {destaques.map((area) => (
                          <div key={area.key} className="space-y-1">
                            <div className="flex justify-between font-label-md">
                              <span>{area.label}</span>
                              <span>R$ {area.percentual.toFixed(2).replace(".", ",")}</span>
                            </div>
                            <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${area.percentual}%`, backgroundColor: area.corBarra }}></div>
                            </div>
                          </div>
                        ))}
                        <div className="space-y-1">
                          <div className="flex justify-between font-label-md opacity-70">
                            <span>Demais Secretarias</span>
                            <span>R$ {outrasPct.toFixed(2).replace(".", ",")}</span>
                          </div>
                          <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden">
                            <div className="bg-white/40 h-full rounded-full" style={{ width: `${outrasPct}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Rankings */}
              <section className="py-20 px-margin-desktop max-w-container-max mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
                  {/* Top Investments */}
                  <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant">
                    <div className="flex items-center gap-4 mb-8">
                      <span className="material-symbols-outlined text-primary text-3xl">star</span>
                      <h3 className="font-headline-md text-headline-md text-on-surface animate-in-target">Maiores Investimentos {EXERCICIO}</h3>
                    </div>
                    <div className="space-y-6">
                      {resumo.topInvestimentos.map((inv, idx) => (
                        <div key={`${inv.titulo}-${idx}`} className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-xl shadow-sm">
                          <span className="font-data-mono text-primary text-xl">#{idx + 1}</span>
                          <div className="flex-1">
                            <p className="font-label-md text-on-surface">{inv.titulo}</p>
                            <p className="text-sm text-on-surface-variant">{inv.secretaria}</p>
                          </div>
                          <p className="text-sm font-semibold text-on-surface whitespace-nowrap">{currency.format(inv.valor)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* What does LOA finance? */}
                  <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant">
                    <div className="flex items-center gap-4 mb-8">
                      <span className="material-symbols-outlined text-secondary text-3xl">help</span>
                      <h3 className="font-headline-md text-headline-md text-on-surface animate-in-target">O que a LOA financia?</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex flex-col items-center text-center">
                        <span className="material-symbols-outlined text-primary mb-2">school</span>
                        <p className="font-label-md text-on-surface">Salário de Professores</p>
                      </div>
                      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex flex-col items-center text-center">
                        <span className="material-symbols-outlined text-primary mb-2">medical_services</span>
                        <p className="font-label-md text-on-surface">Remédios Gratuitos</p>
                      </div>
                      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex flex-col items-center text-center">
                        <span className="material-symbols-outlined text-primary mb-2">lightbulb</span>
                        <p className="font-label-md text-on-surface">Iluminação Pública</p>
                      </div>
                      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex flex-col items-center text-center">
                        <span className="material-symbols-outlined text-primary mb-2">cleaning_services</span>
                        <p className="font-label-md text-on-surface">Coleta de Lixo</p>
                      </div>
                    </div>
                    <p className="mt-6 text-body-md text-on-surface-variant text-center">A Lei Orçamentária Anual define como o dinheiro público manterá a cidade funcionando nos próximos 12 meses.</p>
                  </div>
                </div>
              </section>

              {/* Participation CTA */}
              <section className="py-20 bg-surface-container-lowest">
                <div className="px-margin-desktop max-w-4xl mx-auto text-center">
                  <h2 className="font-display-lg text-display-lg text-primary mb-6">Sua voz faz a diferença</h2>
                  <p className="font-body-lg text-body-lg text-on-surface-variant mb-12">A transparência só é completa com a participação cidadã. Ajude-nos a priorizar os investimentos que Osasco realmente precisa.</p>
                  <div className="flex flex-col sm:flex-row gap-gutter justify-center">
                    <button className="flex items-center justify-center gap-3 bg-secondary text-on-secondary px-10 py-5 rounded-2xl font-label-md text-lg hover:scale-105 transition-soft shadow-lg">
                      <span className="material-symbols-outlined">add_circle</span>
                      Sugerir Investimento
                    </button>
                    <button className="flex items-center justify-center gap-3 border-2 border-outline-variant text-on-surface px-10 py-5 rounded-2xl font-label-md text-lg hover:bg-surface-container-low transition-soft">
                      <span className="material-symbols-outlined">report</span>
                      Reportar Problema
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-surface-container-highest">
          <div className="w-full py-12 px-margin-desktop flex flex-col md:flex-row justify-between items-center max-w-container-max mx-auto gap-8">
            <div className="flex flex-col items-center md:items-start">
              <div className="font-headline-md text-headline-md text-primary font-bold mb-2">Orçamento Transparente</div>
              <p className="font-label-md text-label-md text-on-surface-variant">© {new Date().getFullYear()} Orçamento Transparente - Portal de Transparência Orçamentária.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 font-label-md text-label-md">
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Privacidade</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Acessibilidade</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Dados Abertos</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Contato</a>
            </div>
          </div>
          <div className="border-t border-outline-variant/30 py-4 text-center text-xs text-outline">
            Prefeitura do Município de Osasco - Secretaria de Finanças
          </div>
        </footer>
      </div>
    </>
  );
}
