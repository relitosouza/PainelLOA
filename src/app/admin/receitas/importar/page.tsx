'use client';

import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function ImportacaoReceitasPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResultado(null);
      setErro(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setErro(null);
    setResultado(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/receitas-historicas/importar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na importação');
      }

      setResultado(data);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Importar Receitas Históricas</h1>
      <p className="text-gray-600 mb-8">
        Faça o upload de planilhas (XLSX, CSV) contendo os dados históricos de arrecadação do município.
      </p>

      {/* Área de Upload */}
      <div className="bg-white p-8 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
        <UploadCloud className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Selecione o arquivo de importação</h3>
        <p className="text-sm text-gray-500 mb-6">Suporta formatos .xlsx e .csv</p>
        
        <input 
          type="file" 
          id="fileUpload" 
          className="hidden" 
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={handleFileChange}
        />
        <label 
          htmlFor="fileUpload" 
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
        >
          Procurar arquivo
        </label>

        {file && (
          <div className="mt-6 flex items-center p-3 bg-gray-50 rounded-md w-full max-w-md border border-gray-200">
            <FileText className="h-5 w-5 text-blue-500 mr-3" />
            <div className="flex-1 truncate text-left">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button 
              onClick={() => setFile(null)} 
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Remover
            </button>
          </div>
        )}
      </div>

      {/* Ação */}
      <div className="mt-8 flex justify-end">
        <button
          disabled={!file || loading}
          onClick={handleUpload}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-8 rounded-md flex items-center transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Processando (pode levar alguns minutos)...
            </>
          ) : (
            'Confirmar Importação'
          )}
        </button>
      </div>

      {/* Resultados */}
      {erro && (
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-red-800">Falha na importação</h4>
            <p className="text-sm text-red-700 mt-1">{erro}</p>
          </div>
        </div>
      )}

      {resultado && (
        <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            {resultado.sucesso ? (
              <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-orange-500 mr-2" />
            )}
            <h3 className="text-lg font-medium text-gray-900">
              {resultado.sucesso ? 'Importação finalizada com sucesso' : 'Importação finalizada com erros'}
            </h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 p-4 rounded-md border border-gray-100 text-center">
              <p className="text-sm text-gray-500">Total de Linhas</p>
              <p className="text-2xl font-semibold text-gray-900">{resultado.totalLinhas}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-md border border-green-100 text-center">
              <p className="text-sm text-green-700">Importados</p>
              <p className="text-2xl font-semibold text-green-700">{resultado.importados}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-center">
              <p className="text-sm text-blue-700">Ignorados (Duplicados)</p>
              <p className="text-2xl font-semibold text-blue-700">{resultado.ignorados}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-md border border-red-100 text-center">
              <p className="text-sm text-red-700">Com Erro</p>
              <p className="text-2xl font-semibold text-red-700">{resultado.comErro}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
