# Atualizações de vínculos nos subelementos

## Objetivo

O detalhamento analítico da LOA passou a permitir a distribuição do valor de um subelemento entre vários vínculos. Cada distribuição também pode informar seu código de aplicação.

## Alterações na tela

- O botão **Vínculos** fica na linha de cada subelemento.
- Os vínculos existentes continuam visíveis na própria linha.
- A área de inserção aparece abaixo dos vínculos existentes.
- A área usa campos compactos para facilitar a leitura da tabela.
- O usuário adiciona novas linhas somente quando clica em **+ Vínculo**.
- Cada linha possui os campos:
  - Vínculo;
  - Código de aplicação;
  - Valor.
- Cada vínculo pode ser removido individualmente.

## Distribuição dos valores

O sistema mantém o valor original do subelemento como referência. Ao salvar a distribuição, a soma dos valores informados para os vínculos deve ser igual ao valor original.

Quando a soma for diferente, o sistema impede o salvamento e informa os dois valores para correção.

## Fluxo de uso

1. Expanda a ação e a natureza da despesa.
2. Localize o subelemento que precisa de mais de um vínculo.
3. Clique em **Vínculos**.
4. Preencha o vínculo, o código de aplicação e o valor.
5. Clique em **+ Vínculo** para criar outra linha.
6. Repita o preenchimento conforme necessário.
7. Confira o total distribuído.
8. Clique em **Salvar**.

## Regras atuais

- Um subelemento começa com apenas o vínculo que já possui.
- O sistema não cria três vínculos automaticamente.
- A quantidade de vínculos fica sob controle do usuário.
- A soma dos vínculos não pode ultrapassar nem ficar abaixo do valor do subelemento.
- O vínculo e o código de aplicação ficam associados ao subelemento.
- A edição ocorre diretamente na tabela, sem modal.

## Validação técnica

A implementação foi realizada em `src/components/analise-loa-view.tsx`.

Foi executada a verificação de lint do arquivo. Não foram encontrados erros; permanece apenas um aviso preexistente relacionado à dependência de um `useMemo`.
