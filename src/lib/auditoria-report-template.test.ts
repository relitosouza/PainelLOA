import { describe, it, expect, vi } from "vitest";
import {
  generateAuditoriaReportHtml,
  openAuditoriaReportWindow,
  type AuditoriaReportData,
  type AuditoriaAlteracaoItem,
  type AuditoriaExclusaoItem,
} from "./auditoria-report-template";

describe("auditoria-report-template", () => {
  const mockAlteracoes: AuditoriaAlteracaoItem[] = [
    {
      id: "alt-1",
      exercicio: 2027,
      secretaria: "Secretaria de Saúde",
      codigoSecretaria: "08",
      acao: "Atenção Básica",
      subelemento: "Material Hospitalar",
      valorAnterior: 100000,
      valorNovo: 150000,
      diferenca: 50000,
      justificativa: "Aporte para medicamentos <urgentes>",
      nomeOperador: "Carlos Silva",
      emailOperador: "carlos@osasco.sp.gov.br",
      criadoEm: "2026-09-20T10:00:00Z",
    },
    {
      id: "alt-2",
      exercicio: 2027,
      secretaria: "Secretaria de Obras",
      codigoSecretaria: "12",
      acao: "Infraestrutura",
      subelemento: "Pavimentação",
      valorAnterior: 200000,
      valorNovo: 180000,
      diferenca: -20000,
      justificativa: "Remanejamento para drenagem",
      nomeOperador: "Ana Souza",
      criadoEm: "2026-09-20T11:00:00Z",
    },
  ];

  const mockExclusoes: AuditoriaExclusaoItem[] = [
    {
      id: "exc-1",
      dotacaoId: "dot-99",
      exercicio: 2027,
      secretaria: "Secretaria de Educação",
      acao: "Reforma Escolar",
      subelemento: "Equipamentos de Informática",
      valorOriginal: 75000,
      motivoExclusao: "Dotação duplicada no sistema",
      restaurado: false,
      nomeOperador: "Marcos Lima",
      criadoEm: "2026-09-20T14:30:00Z",
    },
  ];

  it("deve gerar o HTML com cabeçalho oficial e metadados de Osasco", () => {
    const data: AuditoriaReportData = {
      exercicio: 2027,
      secretariaFiltro: "08",
      secretariaNome: "Secretaria de Saúde",
      alteracoes: mockAlteracoes,
      exclusoes: mockExclusoes,
      activeTab: "alteracoes",
    };

    const html = generateAuditoriaReportHtml(data);
    expect(html).toContain("Prefeitura do Município de Osasco");
    expect(html).toContain("Relatório de Auditoria Orçamentária &amp; Rastreabilidade");
    expect(html).toContain("Secretaria de Saúde");
    expect(html).toContain("Exercício Financeiro: <strong class=\"text-on-surface\">2027</strong>");
  });

  it("deve calcular métricas de suplementação, redução e impacto líquido corretamente", () => {
    const data: AuditoriaReportData = {
      alteracoes: mockAlteracoes,
      exclusoes: mockExclusoes,
      activeTab: "alteracoes",
    };

    const html = generateAuditoriaReportHtml(data);
    // Suplementação: +R$ 50.000,00
    expect(html).toMatch(/\+R\$\s*50\.000,00/);
    // Redução: -R$ 20.000,00
    expect(html).toMatch(/-R\$\s*20\.000,00/);
    // Saldo Líquido: +R$ 30.000,00
    expect(html).toMatch(/\+R\$\s*30\.000,00/);
  });

  it("deve sanitizar contra XSS em justificativas e textos", () => {
    const data: AuditoriaReportData = {
      alteracoes: mockAlteracoes,
      exclusoes: mockExclusoes,
      activeTab: "alteracoes",
    };

    const html = generateAuditoriaReportHtml(data);
    expect(html).toContain("Aporte para medicamentos &lt;urgentes&gt;");
    expect(html).not.toContain("<urgentes>");
  });

  it("deve renderizar dotações excluídas quando activeTab for exclusoes ou todas", () => {
    const data: AuditoriaReportData = {
      alteracoes: mockAlteracoes,
      exclusoes: mockExclusoes,
      activeTab: "exclusoes",
    };

    const html = generateAuditoriaReportHtml(data);
    expect(html).toContain("Histórico de Dotações Excluídas");
    expect(html).toContain("Equipamentos de Informática");
    expect(html).toContain("Dotação duplicada no sistema");
    expect(html).not.toContain("Ajustes e Alterações de Dotação Orçamentária");
  });

  it("deve renderizar ambas as seções quando activeTab for todas", () => {
    const data: AuditoriaReportData = {
      alteracoes: mockAlteracoes,
      exclusoes: mockExclusoes,
      activeTab: "todas",
    };

    const html = generateAuditoriaReportHtml(data);
    expect(html).toContain("Ajustes e Alterações de Dotação Orçamentária");
    expect(html).toContain("Histórico de Dotações Excluídas");
  });

  it("deve incluir gatilho de autoPrint quando autoPrint for true", () => {
    const data: AuditoriaReportData = {
      alteracoes: [],
      exclusoes: [],
      autoPrint: true,
    };

    const html = generateAuditoriaReportHtml(data);
    expect(html).toContain("window.print()");
  });

  it("deve tentar abrir janela ao chamar openAuditoriaReportWindow quando window estiver disponível", () => {
    const mockWindowOpen = vi.fn().mockReturnValue({
      document: {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn(),
      },
    });

    // Mock global window
    (globalThis as unknown as { window: unknown }).window = {
      open: mockWindowOpen,
    };

    openAuditoriaReportWindow({
      alteracoes: mockAlteracoes,
      exclusoes: mockExclusoes,
    });

    expect(mockWindowOpen).toHaveBeenCalledWith("", "_blank");

    // Limpar mock
    delete (globalThis as unknown as { window?: unknown }).window;
  });
});
