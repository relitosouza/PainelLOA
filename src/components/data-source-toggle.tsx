"use client";

import { useEffect, useState } from "react";

type DataSource = "ficticio" | "real";

export function useDataSource() {
  const [dataSource, setDataSource] = useState<DataSource>("ficticio");

  useEffect(() => {
    const saved = localStorage.getItem("loa-data-source") as DataSource;
    if (saved === "real" || saved === "ficticio") {
      setDataSource(saved);
    }
  }, []);

  const changeDataSource = (next: DataSource) => {
    setDataSource(next);
    localStorage.setItem("loa-data-source", next);
    window.dispatchEvent(new Event("loa-datasource-change"));
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("loa-data-source") as DataSource;
      if (saved === "real" || saved === "ficticio") {
        setDataSource(saved);
      }
    };
    window.addEventListener("loa-datasource-change", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("loa-datasource-change", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return [dataSource, changeDataSource] as const;
}

export function DataSourceToggle() {
  const [dataSource, setDataSource] = useDataSource();

  return (
    <div className="data-source-toggle" role="group" aria-label="Origem dos dados">
      <button
        type="button"
        className={dataSource === "ficticio" ? "active" : ""}
        onClick={() => setDataSource("ficticio")}
        aria-pressed={dataSource === "ficticio"}
      >
        Dados Simulados
      </button>
      <button
        type="button"
        className={dataSource === "real" ? "active" : ""}
        onClick={() => setDataSource("real")}
        aria-pressed={dataSource === "real"}
      >
        Dados Reais
      </button>
    </div>
  );
}
