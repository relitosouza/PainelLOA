"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function TransparentePage() {
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stats = document.querySelectorAll('.animate-in-target');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, { threshold: 0.1 });

    stats.forEach(stat => observer.observe(stat));
    
    return () => {
      stats.forEach(stat => observer.unobserve(stat));
    };
  }, []);

  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      <style dangerouslySetInnerHTML={{ __html: `
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

      <div className="bg-background font-body-md text-on-background selection:bg-primary-fixed-dim" style={{ fontFamily: "Inter, sans-serif" }}>
        {/* TopNavBar */}
        <header className="bg-surface-container-lowest sticky top-0 z-50 shadow-sm">
          <nav className="flex justify-between items-center w-full px-margin-desktop max-w-container-max mx-auto h-20">
            <Link href="/" className="font-headline-md text-headline-md font-bold text-primary cursor-pointer hover:opacity-80">LOA Transparente</Link>
            <div className="hidden md:flex items-center space-x-8 font-body-md text-body-md">
              <a className="text-primary border-b-2 border-primary pb-1 font-semibold" href="#">Orçamento</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Transparência</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Departamentos</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Relatórios</a>
            </div>
            <div className="flex items-center gap-4">
              <button className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-soft">search</button>
              <button className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-md text-label-md hover:opacity-80 transition-opacity">Entrar</button>
            </div>
          </nav>
        </header>

        <main>
          {/* Hero Section */}
          <section className="relative min-h-[600px] flex items-center overflow-hidden">
            <div className="absolute inset-0 z-0">
              <img 
                className="w-full h-full object-cover" 
                alt="A wide panoramic photograph of Osasco, Brazil" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRJUoFmAKsZLZsk0IuNN37qjGMZvQJn2NxWyHh0Ljk-dfxYGbtXqtYSq8gclSqJhFTc4dMxhNedyofCfuSw_YfGwjHq1_0r0EL6pM89Pdhx1v_aVjuRjfplHBbrL8fXMHFMxa9bmi9yF6vkzULY2WnwwxoYwHdTPql3YFlZROk0YHADYtAyEGPvKYdAocajiSYMbbNiutOUu0bxtgKIEW5uIkR27ADvRNfs77siRYZODjpLgxLd5JIFTweKPE9uJ9u3Q" 
              />
              <div className="absolute inset-0 hero-gradient"></div>
            </div>
            <div className="relative z-10 w-full px-margin-desktop max-w-container-max mx-auto py-20">
              <div className="max-w-2xl">
                <h1 className="font-display-lg text-display-lg text-primary mb-6">LOA Transparente: O Orçamento de Osasco na palma da sua mão</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant mb-10">Consulte cada real investido na sua cidade, acompanhe metas fiscais e participe ativamente da construção do futuro de Osasco.</p>
                {/* Search & Quick Buttons */}
                <div className="bg-surface-container-lowest p-2 rounded-xl shadow-lg border border-outline-variant flex flex-col md:flex-row gap-2 mb-6">
                  <div className="flex-1 flex items-center px-4 bg-surface-container-low rounded-lg focus-within:ring-2 ring-primary/20 transition-soft">
                    <span className="material-symbols-outlined text-outline">search</span>
                    <input className="w-full bg-transparent border-none focus:ring-0 py-3 text-body-md outline-none" placeholder="O que você quer saber sobre o orçamento hoje?" type="text" />
                  </div>
                  <button className="bg-primary text-on-primary px-8 py-3 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity">Buscar Dados</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-label-md text-on-surface-variant flex items-center mr-2">Dúvidas rápidas:</span>
                  <button className="px-4 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-md hover:bg-secondary-container transition-soft">Quanto vai para Saúde?</button>
                  <button className="px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed text-label-md hover:bg-primary-container transition-soft">Obras no meu bairro</button>
                  <button className="px-4 py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-label-md hover:bg-tertiary-container transition-soft">Educação 2024</button>
                </div>
              </div>
            </div>
          </section>

          {/* Overview Stats */}
          <section className="py-16 bg-surface-container-low">
            <div className="px-margin-desktop max-w-container-max mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter" ref={statsRef}>
                {/* Total Budget */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-soft">
                  <div className="w-12 h-12 bg-primary-fixed rounded-lg flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-primary">payments</span>
                  </div>
                  <p className="text-label-md text-on-surface-variant mb-1">Orçamento Total 2024</p>
                  <h3 className="font-headline-lg text-headline-lg text-primary animate-in-target">R$ 4.2 Bi</h3>
                  <div className="flex items-center gap-1 mt-2 text-green-600 font-label-md">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    <span>+8% vs 2023</span>
                  </div>
                </div>
                {/* Investment per Inhabitant */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-soft">
                  <div className="w-12 h-12 bg-secondary-fixed rounded-lg flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-secondary">person_pin_circle</span>
                  </div>
                  <p className="text-label-md text-on-surface-variant mb-1">Investimento por Habitante</p>
                  <h3 className="font-headline-lg text-headline-lg text-secondary animate-in-target">R$ 5.920</h3>
                  <p className="text-label-md text-on-surface-variant mt-2 italic">Foco em infraestrutura</p>
                </div>
                {/* Execution Rate */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-soft">
                  <div className="w-12 h-12 bg-tertiary-fixed rounded-lg flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-tertiary">check_circle</span>
                  </div>
                  <p className="text-label-md text-on-surface-variant mb-1">Execução Orçamentária</p>
                  <h3 className="font-headline-lg text-headline-lg text-tertiary animate-in-target">64%</h3>
                  <div className="w-full bg-surface-container-high h-2 rounded-full mt-4">
                    <div className="bg-tertiary-container h-full rounded-full w-[64%]"></div>
                  </div>
                </div>
                {/* Projects Ongoing */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-soft">
                  <div className="w-12 h-12 bg-primary-fixed-dim rounded-lg flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-primary">construction</span>
                  </div>
                  <p className="text-label-md text-on-surface-variant mb-1">Obras em Andamento</p>
                  <h3 className="font-headline-lg text-headline-lg text-primary animate-in-target">124</h3>
                  <p className="text-label-md text-on-surface-variant mt-2">Clique para ver o mapa</p>
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
                <h4 className="font-headline-md text-headline-md text-on-surface mb-3">Dados em Tempo Real</h4>
                <p className="text-body-md text-on-surface-variant">As informações são atualizadas diariamente para garantir que você veja o status atual da gestão.</p>
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
                  <h2 className="font-display-lg text-display-lg mb-6">Para onde vão cada R$ 100,00 arrecadados?</h2>
                  <p className="font-body-lg text-body-lg opacity-90 mb-8">Entenda de forma visual como os impostos que você paga são redistribuídos entre as secretarias e serviços da Prefeitura de Osasco.</p>
                  <button className="bg-surface-container-lowest text-primary px-8 py-3 rounded-xl font-label-md hover:bg-primary-fixed transition-soft">Ver Detalhado por Secretaria</button>
                </div>
                <div className="lg:w-1/2 w-full">
                  <div className="space-y-4 bg-surface-container-lowest/10 p-8 rounded-2xl backdrop-blur-md">
                    {/* Health */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-label-md">
                        <span>Saúde</span>
                        <span>R$ 28,50</span>
                      </div>
                      <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden">
                        <div className="bg-[#A7F3D0] h-full rounded-full" style={{ width: "28.5%" }}></div>
                      </div>
                    </div>
                    {/* Education */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-label-md">
                        <span>Educação</span>
                        <span>R$ 25,20</span>
                      </div>
                      <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden">
                        <div className="bg-[#BAE6FD] h-full rounded-full" style={{ width: "25.2%" }}></div>
                      </div>
                    </div>
                    {/* Security */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-label-md">
                        <span>Segurança e Mobilidade</span>
                        <span>R$ 15,80</span>
                      </div>
                      <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden">
                        <div className="bg-[#FEF08A] h-full rounded-full" style={{ width: "15.8%" }}></div>
                      </div>
                    </div>
                    {/* Infrastructure */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-label-md">
                        <span>Obras e Infraestrutura</span>
                        <span>R$ 12,50</span>
                      </div>
                      <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden">
                        <div className="bg-[#FED7AA] h-full rounded-full" style={{ width: "12.5%" }}></div>
                      </div>
                    </div>
                    {/* Other */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-label-md opacity-70">
                        <span>Demais Encargos</span>
                        <span>R$ 18,00</span>
                      </div>
                      <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden">
                        <div className="bg-white/40 h-full rounded-full" style={{ width: "18%" }}></div>
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
                  <h3 className="font-headline-md text-headline-md text-on-surface animate-in-target">Maiores Investimentos 2024</h3>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-xl shadow-sm">
                    <span className="font-data-mono text-primary text-xl">#1</span>
                    <div className="flex-1">
                      <p className="font-label-md text-on-surface">Modernização Hospital Municipal</p>
                      <p className="text-sm text-on-surface-variant">R$ 45.000.000,00</p>
                    </div>
                    <span className="material-symbols-outlined text-green-600">arrow_upward</span>
                  </div>
                  <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-xl shadow-sm">
                    <span className="font-data-mono text-primary text-xl">#2</span>
                    <div className="flex-1">
                      <p className="font-label-md text-on-surface">Pavimentação Zona Norte</p>
                      <p className="text-sm text-on-surface-variant">R$ 32.500.000,00</p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">remove</span>
                  </div>
                  <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-xl shadow-sm">
                    <span className="font-data-mono text-primary text-xl">#3</span>
                    <div className="flex-1">
                      <p className="font-label-md text-on-surface">Creche Integral Munhoz</p>
                      <p className="text-sm text-on-surface-variant">R$ 18.200.000,00</p>
                    </div>
                    <span className="material-symbols-outlined text-green-600">arrow_upward</span>
                  </div>
                </div>
              </div>
              {/* What does LOA finance? */}
              <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant">
                <div className="flex items-center gap-4 mb-8">
                  <span className="material-symbols-outlined text-secondary text-3xl">help</span>
                  <h3 className="font-headline-md text-headline-md text-on-surface animate-in-target">O que a LOA financia?</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex flex-col items-center text-center hover:scale-105 transition-soft cursor-pointer">
                    <span className="material-symbols-outlined text-primary mb-2">school</span>
                    <p className="font-label-md text-on-surface">Salário de Professores</p>
                  </div>
                  <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex flex-col items-center text-center hover:scale-105 transition-soft cursor-pointer">
                    <span className="material-symbols-outlined text-primary mb-2">medical_services</span>
                    <p className="font-label-md text-on-surface">Remédios Gratuitos</p>
                  </div>
                  <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex flex-col items-center text-center hover:scale-105 transition-soft cursor-pointer">
                    <span className="material-symbols-outlined text-primary mb-2">lightbulb</span>
                    <p className="font-label-md text-on-surface">Iluminação Pública</p>
                  </div>
                  <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex flex-col items-center text-center hover:scale-105 transition-soft cursor-pointer">
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
        </main>

        {/* Footer */}
        <footer className="bg-surface-container-highest">
          <div className="w-full py-12 px-margin-desktop flex flex-col md:flex-row justify-between items-center max-w-container-max mx-auto gap-8">
            <div className="flex flex-col items-center md:items-start">
              <div className="font-headline-md text-headline-md text-primary font-bold mb-2">LOA Transparente</div>
              <p className="font-label-md text-label-md text-on-surface-variant">© 2024 LOA Transparente - Portal de Transparência Orçamentária.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 font-label-md text-label-md">
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Privacidade</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Acessibilidade</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Dados Abertos</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Contato</a>
            </div>
            <div className="flex gap-4">
              <a className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-primary-fixed transition-soft" href="#">
                <span className="material-symbols-outlined">share</span>
              </a>
              <a className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-primary-fixed transition-soft" href="#">
                <span className="material-symbols-outlined">help</span>
              </a>
            </div>
          </div>
          <div className="border-t border-outline-variant/30 py-4 text-center text-xs text-outline">
            Prefeitura do Município de Osasco - Secretaria de Planejamento e Gestão
          </div>
        </footer>
      </div>
    </>
  );
}
