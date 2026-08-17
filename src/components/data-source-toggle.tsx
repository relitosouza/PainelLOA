"use client";

import { useEffect, useState } from "react";

type DataSource = "ficticio" | "real";

export function useDataSource() {
  // Padrão definitivo: 'real' (dados reais do banco de dados)
  const [dataSource, setDataSource] = useState<DataSource>("real");

  useEffect(() => {
    // Garantir que a fonte seja sempre 'real'
    localStorage.setItem("loa-data-source", "real");
  }, []);

  const changeDataSource = (next: DataSource) => {
    setDataSource(next);
    localStorage.setItem("loa-data-source", next);
    window.dispatchEvent(new Event("loa-datasource-change"));
  };

  return [dataSource, changeDataSource] as const;
}

export function DataSourceToggle() {
  // Ocultar a opção de dados simulados da interface, operando 100% com dados reais
  return null;
}

