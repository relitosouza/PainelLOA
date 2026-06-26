"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useMemo } from "react";
import { useDataSource, DataSourceToggle } from "@/components/data-source-toggle";

export default function TransparentePage() {
  const statsRef = useRef<HTMLDivElement>(null);
  const [dataSource] = useDataSource();
  const [dbData, setDbData] = useState<any>(null);
  const [loadingDb, setLoadingDb] = useState(false);

  useEffect(() => {
    if (dataSource === "real" && !dbData) {
      setLoadingDb(true);
      fetch("/api/loa?all=true")
        .then((res) => res.json())
        .then((res) => {
          setDbData(res);
        })
        .catch(console.error)
        .finally(() => setLoadingDb(false));
    }
  }, [dataSource, dbData]);

  // Dynamic calculations based on active data source
  const isReal = dataSource === "real" && dbData && dbData.records;
  
  // Total LOA
  const totalLoa = isReal ? dbData.totals.loa : 6500000000;
  
  // Investimento por Habitante
  const invPerHab = isReal ? Math.round(totalLoa / 760000) : 8552;

  // New Projects count (Obras)
  const obrasCount = isReal ? dbData.counts.newProjects : 124;

  // Category values (Saúde, Educação, Mobilidade, Obras, Assistência Social, Cultura, Habitação, Emprego)
  const getCategoryValue = (prefix: string) => {
    if (!isReal) return 0;
    return dbData.records
      .filter((r: any) => r.organ.startsWith(prefix))
      .reduce((sum: number, r: any) => sum + r.value, 0);
  };

  const values = useMemo(() => {
    if (!isReal) {
      return {
        saude: 975000000,
        educacao: 1625000000,
        mobilidade: 1140000000,
        obras: 1540000000,
        social: 760000000,
        cultura: 120000000,
        habitacao: 300000000,
        emprego: 160000000,
      };
    }
    return {
      saude: getCategoryValue("01.09"),
      educacao: getCategoryValue("01.08"),
      mobilidade: getCategoryValue("01.19"),
      obras: getCategoryValue("01.11"),
      social: getCategoryValue("01.14") + getCategoryValue("01.36") + getCategoryValue("01.20"),
      cultura: getCategoryValue("01.15"),
      habitacao: getCategoryValue("01.13"),
      emprego: getCategoryValue("01.07"),
    };
  }, [isReal, dbData]);

  // Format Helper
  const formatBillion = (val: number) => {
    if (val >= 1e9) {
      const formatted = (val / 1e9).toFixed(1).replace(".", ",");
      return `R$ ${formatted} Bi`;
    }
    return `R$ ${Math.round(val / 1e6)} Mi`;
  };

  const formatValueDescription = (val: number) => {
    if (val >= 1e9) {
      const formatted = (val / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 3 });
      return `R$ ${formatted} Bilhão`;
    }
    return `R$ ${Math.round(val / 1e6)} Milhões`;
  };

  const saudePct = totalLoa ? (values.saude / totalLoa) * 100 : 0;
  const educacaoPct = totalLoa ? (values.educacao / totalLoa) * 100 : 0;
  const obrasPct = totalLoa ? (values.obras / totalLoa) * 100 : 0;
  const mobilidadePct = totalLoa ? (values.mobilidade / totalLoa) * 100 : 0;
  const socialPct = totalLoa ? (values.social / totalLoa) * 100 : 0;
  const culturaPct = totalLoa ? (values.cultura / totalLoa) * 100 : 0;
  const habitacaoPct = totalLoa ? (values.habitacao / totalLoa) * 100 : 0;
  const empregoPct = totalLoa ? (values.emprego / totalLoa) * 100 : 0;

  const totalOfThesePct = saudePct + educacaoPct + obrasPct + mobilidadePct + socialPct;
  const otherPct = Math.max(0, 100 - totalOfThesePct);

  const topInvestments = useMemo(() => {
    if (!isReal) {
      return [
        { title: "Modernização Hospital Municipal", value: 45000000, trend: "arrow_upward", trendColor: "text-green-600" },
        { title: "Pavimentação Zona Norte", value: 32500000, trend: "remove", trendColor: "text-on-surface-variant" },
        { title: "Creche Integral Munhoz", value: 18200000, trend: "arrow_upward", trendColor: "text-green-600" },
      ];
    }
    const investments = dbData.records
      .filter((r: any) => r.expenseNature.startsWith("4") || r.subelement === "51")
      .sort((a: any, b: any) => b.value - a.value);

    return investments.slice(0, 3).map((inv: any) => ({
      title: inv.administrativeProcess || inv.action || "Investimento",
      value: inv.value,
      trend: "arrow_upward",
      trendColor: "text-green-600",
    }));
  }, [isReal, dbData]);

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
              <div className="transparent-nav-toggle">
                <DataSourceToggle />
              </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter" ref={statsRef}>
                {/* Total Budget */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-soft">
                  <div className="w-12 h-12 bg-primary-fixed rounded-lg flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-primary">payments</span>
                  </div>
                  <p className="text-label-md text-on-surface-variant mb-1">Orçamento Total 2027</p>
                  <h3 className="font-headline-lg text-headline-lg text-primary animate-in-target">{formatBillion(totalLoa)}</h3>
                  <div className="flex items-center gap-1 mt-2 text-green-600 font-label-md">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    <span>+54,8% vs 2024</span>
                  </div>
                </div>
                {/* Receita Corrente */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-soft">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/40 rounded-lg flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-blue-600">bar_chart</span>
                  </div>
                  <p className="text-label-md text-on-surface-variant mb-1">📊 Receita Corrente</p>
                  <h3 className="font-headline-lg text-headline-lg text-blue-600 animate-in-target">{formatBillion(totalLoa * 0.8)}</h3>
                  <p className="text-label-md text-on-surface-variant mt-2 italic">80% do total planejado</p>
                </div>
                {/* Receita de Capital */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-soft">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-emerald-600">engineering</span>
                  </div>
                  <p className="text-label-md text-on-surface-variant mb-1">🏗️ Receita de Capital</p>
                  <h3 className="font-headline-lg text-headline-lg text-emerald-600 animate-in-target">{formatBillion(totalLoa * 0.09230769)}</h3>
                  <p className="text-label-md text-on-surface-variant mt-2 italic">9.2% do total planejado</p>
                </div>
                {/* Investment per Inhabitant */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-soft">
                  <div className="w-12 h-12 bg-secondary-fixed rounded-lg flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-secondary">person_pin_circle</span>
                  </div>
                  <p className="text-label-md text-on-surface-variant mb-1">Investimento por Habitante</p>
                  <h3 className="font-headline-lg text-headline-lg text-secondary animate-in-target">R$ {invPerHab.toLocaleString("pt-BR")}</h3>
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
                  <h3 className="font-headline-lg text-headline-lg text-primary animate-in-target">{obrasCount}</h3>
                  <p className="text-label-md text-on-surface-variant mt-2">Clique para ver o mapa</p>
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
                {/* Saúde */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-soft flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-emerald-600">medical_services</span>
                      </div>
                      <p className="text-label-md text-on-surface-variant font-semibold">Saúde</p>
                    </div>
                    <h3 className="font-headline-lg text-headline-lg text-emerald-600">{formatValueDescription(values.saude)}</h3>
                    <p className="text-label-md text-on-surface-variant mt-2 font-semibold">{saudePct.toFixed(1).replace(".", ",")}% da LOA</p>
                  </div>
                  <div className="border-t border-outline-variant/50 pt-4 mt-4">
                    <div className="flex flex-wrap gap-1">
                      {['Hospitais', 'UBS', 'medicamentos', 'atendimento à population'].map((tag) => (
                        <span key={tag} className="bg-surface-container-low text-on-surface-variant text-[11px] px-2 py-0.5 rounded border border-outline-variant/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Educação */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-soft flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/40 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-blue-600">school</span>
                      </div>
                      <p className="text-label-md text-on-surface-variant font-semibold">Educação</p>
                    </div>
                    <h3 className="font-headline-lg text-headline-lg text-blue-600">{formatValueDescription(values.educacao)}</h3>
                    <p className="text-label-md text-on-surface-variant mt-2 font-semibold">{educacaoPct.toFixed(1).replace(".", ",")}% da LOA</p>
                  </div>
                  <div className="border-t border-outline-variant/50 pt-4 mt-4">
                    <div className="flex flex-wrap gap-1">
                      {['Escolas', 'merenda', 'transporte escolar', 'ensino'].map((tag) => (
                        <span key={tag} className="bg-surface-container-low text-on-surface-variant text-[11px] px-2 py-0.5 rounded border border-outline-variant/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobilidade Urbana */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-soft flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950/40 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-amber-600">directions_bus</span>
                      </div>
                      <p className="text-label-md text-on-surface-variant font-semibold">Mobilidade Urbana</p>
                    </div>
                    <h3 className="font-headline-lg text-headline-lg text-amber-600">{formatValueDescription(values.mobilidade)}</h3>
                    <p className="text-label-md text-on-surface-variant mt-2 font-semibold">{mobilidadePct.toFixed(1).replace(".", ",")}% da LOA</p>
                  </div>
                  <div className="border-t border-outline-variant/50 pt-4 mt-4">
                    <div className="flex flex-wrap gap-1">
                      {['Trânsito', 'transporte', 'infraestrutura viária'].map((tag) => (
                        <span key={tag} className="bg-surface-container-low text-on-surface-variant text-[11px] px-2 py-0.5 rounded border border-outline-variant/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Obras */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-soft flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950/40 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-purple-600">engineering</span>
                      </div>
                      <p className="text-label-md text-on-surface-variant font-semibold">Obras</p>
                    </div>
                    <h3 className="font-headline-lg text-headline-lg text-purple-600">{formatValueDescription(values.obras)}</h3>
                    <p className="text-label-md text-on-surface-variant mt-2 font-semibold">{obrasPct.toFixed(1).replace(".", ",")}% da LOA</p>
                  </div>
                  <div className="border-t border-outline-variant/50 pt-4 mt-4">
                    <div className="flex flex-wrap gap-1">
                      {['Pavimentação', 'drenagem', 'melhorias urbanas'].map((tag) => (
                        <span key={tag} className="bg-surface-container-low text-on-surface-variant text-[11px] px-2 py-0.5 rounded border border-outline-variant/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Assistência Social */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-soft flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-rose-100 dark:bg-rose-950/40 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-rose-600">shield</span>
                      </div>
                      <p className="text-label-md text-on-surface-variant font-semibold">Assistência Social</p>
                    </div>
                    <h3 className="font-headline-lg text-headline-lg text-rose-600">{formatValueDescription(values.social)}</h3>
                    <p className="text-label-md text-on-surface-variant mt-2 font-semibold">{socialPct.toFixed(1).replace(".", ",")}% da LOA</p>
                  </div>
                  <div className="border-t border-outline-variant/50 pt-4 mt-4">
                    <div className="flex flex-wrap gap-1">
                      {['Guarda Municipal', 'monitoramento', 'proteção urbana'].map((tag) => (
                        <span key={tag} className="bg-surface-container-low text-on-surface-variant text-[11px] px-2 py-0.5 rounded border border-outline-variant/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cultura */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-soft flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-pink-100 dark:bg-pink-950/40 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-pink-600">palette</span>
                      </div>
                      <p className="text-label-md text-on-surface-variant font-semibold">Cultura</p>
                    </div>
                    <h3 className="font-headline-lg text-headline-lg text-pink-600">{formatValueDescription(values.cultura)}</h3>
                    <p className="text-label-md text-on-surface-variant mt-2 font-semibold">{culturaPct.toFixed(1).replace(".", ",")}% da LOA</p>
                  </div>
                  <div className="border-t border-outline-variant/50 pt-4 mt-4">
                    <div className="flex flex-wrap gap-1">
                      {['Eventos culturais', 'bibliotecas', 'incentivo à cultura'].map((tag) => (
                        <span key={tag} className="bg-surface-container-low text-on-surface-variant text-[11px] px-2 py-0.5 rounded border border-outline-variant/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Habitação */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-soft flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-teal-100 dark:bg-teal-950/40 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-teal-600">home</span>
                      </div>
                      <p className="text-label-md text-on-surface-variant font-semibold">Habitação</p>
                    </div>
                    <h3 className="font-headline-lg text-headline-lg text-teal-600">{formatValueDescription(values.habitacao)}</h3>
                    <p className="text-label-md text-on-surface-variant mt-2 font-semibold">{habitacaoPct.toFixed(1).replace(".", ",")}% da LOA</p>
                  </div>
                  <div className="border-t border-outline-variant/50 pt-4 mt-4">
                    <div className="flex flex-wrap gap-1">
                      {['Construção de moradias', 'melhorias habitacionais para famílias'].map((tag) => (
                        <span key={tag} className="bg-surface-container-low text-on-surface-variant text-[11px] px-2 py-0.5 rounded border border-outline-variant/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Emprego */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-soft flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-950/40 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-cyan-600">work</span>
                      </div>
                      <p className="text-label-md text-on-surface-variant font-semibold">Emprego</p>
                    </div>
                    <h3 className="font-headline-lg text-headline-lg text-cyan-600">{formatValueDescription(values.emprego)}</h3>
                    <p className="text-label-md text-on-surface-variant mt-2 font-semibold">{empregoPct.toFixed(1).replace(".", ",")}% da LOA</p>
                  </div>
                  <div className="border-t border-outline-variant/50 pt-4 mt-4">
                    <div className="flex flex-wrap gap-1">
                      {['Qualificação profissional', 'apoio ao empreendedorismo', 'geração de empregos', 'inovação e fortalecimento da economia local'].map((tag) => (
                        <span key={tag} className="bg-surface-container-low text-on-surface-variant text-[11px] px-2 py-0.5 rounded border border-outline-variant/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Disclaimer Banner */}
              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex items-start gap-3 max-w-3xl mx-auto shadow-sm">
                <span className="material-symbols-outlined text-primary">info</span>
                <div className="text-sm text-on-surface-variant leading-relaxed">
                  <p>
                    <strong>Nota Informativa:</strong> Esses dados serão somente informativos até as informações serem inseridas nos relatórios analíticos oficiais.
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
                        <span>R$ {saudePct.toFixed(2).replace(".", ",")}</span>
                      </div>
                      <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden">
                        <div className="bg-[#A7F3D0] h-full rounded-full" style={{ width: `${saudePct}%` }}></div>
                      </div>
                    </div>
                    {/* Education */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-label-md">
                        <span>Educação</span>
                        <span>R$ {educacaoPct.toFixed(2).replace(".", ",")}</span>
                      </div>
                      <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden">
                        <div className="bg-[#BAE6FD] h-full rounded-full" style={{ width: `${educacaoPct}%` }}></div>
                      </div>
                    </div>
                    {/* Obras */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-label-md">
                        <span>Obras e Infraestrutura</span>
                        <span>R$ {obrasPct.toFixed(2).replace(".", ",")}</span>
                      </div>
                      <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden">
                        <div className="bg-[#FED7AA] h-full rounded-full" style={{ width: `${obrasPct}%` }}></div>
                      </div>
                    </div>
                    {/* Transport */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-label-md">
                        <span>Transporte e Mobilidade</span>
                        <span>R$ {mobilidadePct.toFixed(2).replace(".", ",")}</span>
                      </div>
                      <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden">
                        <div className="bg-[#FEF08A] h-full rounded-full" style={{ width: `${mobilidadePct}%` }}></div>
                      </div>
                    </div>
                    {/* Social */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-label-md">
                        <span>Assistência Social e Segurança</span>
                        <span>R$ {socialPct.toFixed(2).replace(".", ",")}</span>
                      </div>
                      <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden">
                        <div className="bg-[#F87171] h-full rounded-full" style={{ width: `${socialPct}%` }}></div>
                      </div>
                    </div>
                    {/* Other */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-label-md opacity-70">
                        <span>Demais Secretarias</span>
                        <span>R$ {otherPct.toFixed(2).replace(".", ",")}</span>
                      </div>
                      <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden">
                        <div className="bg-white/40 h-full rounded-full" style={{ width: `${otherPct}%` }}></div>
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
                  <h3 className="font-headline-md text-headline-md text-on-surface animate-in-target">Maiores Investimentos {isReal ? "2027" : "2024"}</h3>
                </div>
                <div className="space-y-6">
                  {topInvestments.map((inv: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-xl shadow-sm">
                      <span className="font-data-mono text-primary text-xl">#{idx + 1}</span>
                      <div className="flex-1">
                        <p className="font-label-md text-on-surface">{inv.title}</p>
                        <p className="text-sm text-on-surface-variant">{inv.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                      </div>
                      <span className={`material-symbols-outlined ${inv.trendColor}`}>{inv.trend}</span>
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
