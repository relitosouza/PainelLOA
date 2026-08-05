# Dashboards de dados reais da LOA

## Objetivo
Cruzar as despesas importadas com o catálogo oficial informado e ampliar o painel sem remover os gráficos ou os dados simulados existentes.

## Tarefas
- [x] Consolidar o catálogo de classificação da despesa e suas regras de validação. → Verificar códigos válidos, ausências e divergências.
- [x] Permitir selecionar exercício e importação na consulta de dados reais. → A API deve limitar todos os totais e grupos à seleção.
- [x] Expor indicadores de conformidade mantendo registros pendentes nos totais. → Totais importados devem permanecer conciliados.
- [x] Adicionar painéis de classificação e auditoria sem substituir os gráficos atuais. → Alternar entre dados simulados e reais.
- [x] Criar a seção “Detalhamento das Secretarias”. → Exibir ranking, participação e quantidade de registros.
- [x] Validar sintaxe, empacotamento e consultas ao banco real. → Lint, tipos e build completos dependem de Node/npm, indisponíveis no ambiente.

## Concluído quando
- [x] Dados simulados permanecem disponíveis e inalterados.
- [x] Toda importação de despesa aparece como dado real.
- [x] Exercício/importação controla os indicadores reais.
- [x] Registros divergentes permanecem nos totais e recebem alerta visível.
