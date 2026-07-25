# Casos de teste

Este documento descreve todos os testes automatizados do projeto.

## Resumo

| Camada | Tecnologia | Suites | Casos |
| --- | --- | ---: | ---: |
| Backend | JUnit 5 e Mockito | 6 | 44 |
| Frontend | Vitest e Testing Library | 3 | 14 |
| Total | - | 9 | 58 |

Os testes do backend sao unitarios e utilizam mocks dos repositorios. Eles nao
iniciam o Spring Boot e nao leem ou alteram o MongoDB configurado na aplicacao.
Os testes do frontend usam `jsdom`; os casos relacionados a tempo usam relogio
falso para serem deterministas.

## Como executar

Backend, incluindo recompilacao completa:

```powershell
cd backend
.\mvnw.cmd clean test
```

Frontend, uma unica execucao:

```powershell
cd frontend
npm test
```

Frontend, executando novamente a cada alteracao:

```powershell
cd frontend
npm run test:watch
```

Build de producao do frontend:

```powershell
cd frontend
npm run build
```

## Backend

### CadastroBusinessRulesTest

Arquivo:
`backend/src/test/java/com/dtidigital/fretesdrones/controller/CadastroBusinessRulesTest.java`

| ID | Caso | Cenario | Resultado esperado |
| --- | --- | --- | --- |
| BE-CAD-01 | Criar hangar em posicao ocupada | Ja existe um hangar nas coordenadas solicitadas. | Retorna HTTP 400, informa o conflito e nao salva o hangar. |
| BE-CAD-02 | Mover hangar para posicao ocupada | Outro hangar utiliza as coordenadas de destino. | Retorna HTTP 400 e mantem o hangar sem gravacao. |
| BE-CAD-03 | Alterar hangar de outro usuario | O hangar pertence a um usuario diferente do autenticado. | Retorna HTTP 403 e nao salva alteracoes. |
| BE-CAD-04 | Excluir hangar de outro usuario | O hangar pertence a um usuario diferente do autenticado. | Retorna HTTP 403 e nao exclui o registro. |
| BE-CAD-05 | Excluir hangar inexistente | O identificador nao existe no repositorio. | Retorna HTTP 404. |
| BE-CAD-06 | Criar modelo com nome duplicado | O usuario ja possui um modelo com o mesmo nome, ignorando maiusculas. | Retorna HTTP 400 e nao salva o modelo. |
| BE-CAD-07 | Renomear modelo para nome existente | Outro modelo do usuario ja utiliza o nome solicitado. | Retorna HTTP 400 e nao salva alteracoes. |
| BE-CAD-08 | Alterar modelo de outro usuario | O modelo pertence a outro usuario. | Retorna HTTP 403 e nao salva alteracoes. |
| BE-CAD-09 | Excluir modelo de outro usuario | O modelo pertence a outro usuario. | Retorna HTTP 403 e nao exclui o registro. |
| BE-CAD-10 | Excluir modelo inexistente | O identificador nao existe no repositorio. | Retorna HTTP 404. |

### DroneControllerBusinessRulesTest

Arquivo:
`backend/src/test/java/com/dtidigital/fretesdrones/controller/DroneControllerBusinessRulesTest.java`

| ID | Caso | Cenario | Resultado esperado |
| --- | --- | --- | --- |
| BE-DRN-01 | Alterar status durante despacho | O drone esta em `EM_DESPACHO` e recebe alteracao manual de status. | Retorna HTTP 400 e nao salva a alteracao. |
| BE-DRN-02 | Informar status desconhecido | O status solicitado nao pertence ao enum de drones. | Retorna HTTP 400 com mensagem de status invalido. |
| BE-DRN-03 | Alterar drone de outro usuario | O drone nao pertence ao usuario autenticado. | Retorna HTTP 403 e nao salva a alteracao. |
| BE-DRN-04 | Iniciar frete sem rota pendente | O drone nao esta em despacho com rota `AGUARDANDO_INICIO`. | Retorna HTTP 400 e nao inicia o frete. |
| BE-DRN-05 | Iniciar rota sem bateria suficiente | A porcentagem necessaria para a rota supera a bateria atual. | Retorna HTTP 400 e nao salva o inicio da rota. |
| BE-DRN-06 | Iniciar frete sem dados de percurso validos | A distancia esta ausente ou a velocidade nao e positiva. | Retorna HTTP 400 e nao calcula o tempo do frete. |
| BE-DRN-07 | Remover entregas sem selecao | A lista de entregas selecionadas esta vazia. | Retorna HTTP 400 e nao altera entregas. |
| BE-DRN-08 | Resetar drone de outro usuario | O drone pertence a outro usuario. | Retorna HTTP 403 e nao dispara nova alocacao. |

### EntregaControllerBusinessRulesTest

Arquivo:
`backend/src/test/java/com/dtidigital/fretesdrones/controller/EntregaControllerBusinessRulesTest.java`

| ID | Caso | Cenario | Resultado esperado |
| --- | --- | --- | --- |
| BE-ENT-01 | Confirmar sem entregas | A requisicao possui uma lista vazia. | Retorna HTTP 400 e nao executa alocacao. |
| BE-ENT-02 | Confirmar com entrega inviavel pendente | Existe entrega que nenhum drone atende por peso ou autonomia. | Retorna HTTP 400 e exige tratamento antes da movimentacao. |
| BE-ENT-03 | Confirmar entrega de outro usuario | A entrega informada nao pertence ao usuario autenticado. | Retorna HTTP 400 e nao salva a entrega. |
| BE-ENT-04 | Movimentar entrega ja despachada | A entrega esta em `EM_DESPACHO`. | Retorna HTTP 400 e impede uma segunda movimentacao. |
| BE-ENT-05 | Criar entrega com prioridade invalida | A prioridade nao e baixa, media ou alta. | Retorna HTTP 400 e nao salva a entrega. |
| BE-ENT-06 | Editar entrega despachada | A entrega ja esta em `EM_DESPACHO`. | Retorna HTTP 400 e nao salva alteracoes. |
| BE-ENT-07 | Editar entrega de outro usuario | A entrega pertence a outro usuario. | Retorna HTTP 403 e nao salva alteracoes. |
| BE-ENT-08 | Dividir com soma diferente do peso original | Os pesos sao positivos, mas nao totalizam o peso original. | Retorna HTTP 400 e preserva a entrega original. |
| BE-ENT-09 | Dividir em menos de duas partes | A requisicao contem somente uma particao. | Retorna HTTP 400 e rejeita a divisao. |
| BE-ENT-10 | Dividir entrega de outro usuario | A entrega original pertence a outro usuario. | Retorna HTTP 403 e preserva a entrega original. |

### DeliveryAllocationServiceTest

Arquivo:
`backend/src/test/java/com/dtidigital/fretesdrones/service/DeliveryAllocationServiceTest.java`

| ID | Caso | Cenario | Resultado esperado |
| --- | --- | --- | --- |
| BE-ALO-01 | Agrupar entregas no mesmo drone | Uma entrega de alta prioridade ja ocupa um drone; outro drone parado nao comporta a proxima entrega, mas o primeiro ainda possui capacidade. | As duas entregas sao vinculadas ao primeiro drone, respeitando carga maxima e prioridade. |
| BE-ALO-02 | Escolher melhor aproveitamento de carga | Dois drones atendem a entrega, mas um deixa menor capacidade ociosa. | A entrega e alocada ao drone com encaixe mais justo. |
| BE-ALO-03 | Marcar inviavel por peso | Nenhum drone possui capacidade maxima suficiente. | A entrega recebe `INVIAVEL`, fica sem drone e nenhuma rota e planejada. |
| BE-ALO-04 | Marcar inviavel por autonomia | Mesmo com bateria cheia, nenhum drone conclui ida, entregas e retorno. | A entrega recebe `INVIAVEL`. |
| BE-ALO-05 | Manter confirmada por bateria momentaneamente baixa | A autonomia total atende a rota, mas a bateria atual nao. | A entrega permanece `CONFIRMADA` e aguarda, sem ser marcada como inviavel. |
| BE-ALO-06 | Ignorar drone indisponivel | O unico drone capaz esta em rota. | A entrega permanece `CONFIRMADA` e sem drone. |

### DeliveryCompletionServiceTest

Arquivo:
`backend/src/test/java/com/dtidigital/fretesdrones/service/DeliveryCompletionServiceTest.java`

| ID | Caso | Cenario | Resultado esperado |
| --- | --- | --- | --- |
| BE-CIC-01 | Concluir entrega pelo horario | Uma entrega venceu seu horario estimado e outra ainda esta no prazo. | Apenas a entrega vencida muda para `ENTREGUE` e e salva. |
| BE-CIC-02 | Consumir bateria durante a rota | O drone percorreu metade de uma rota que consome 20% da bateria. | A bateria passa de 100% para aproximadamente 90%. |
| BE-CIC-03 | Finalizar rota e iniciar recarga | O drone concluiu uma rota de 20% da autonomia. | A bateria fica em 80%, a carga zera e o status muda para `RECARREGANDO`. |
| BE-CIC-04 | Recarregar 3% por minuto | O drone estava com 40% ha dez minutos. | A bateria passa para aproximadamente 70% e o status continua `RECARREGANDO`. |
| BE-CIC-05 | Liberar drone com carga completa | O tempo de recarga e suficiente para superar 100%. | A bateria e limitada a 100%, o status muda para `DISPONIVEL` e a alocacao e acionada. |
| BE-CIC-06 | Nao recarregar sem horario inicial | O drone esta `RECARREGANDO`, mas nao possui `chargingStartedAt`. | A bateria nao e alterada e o drone nao e salvo. |

### RoutePlanningServiceTest

Arquivo:
`backend/src/test/java/com/dtidigital/fretesdrones/service/RoutePlanningServiceTest.java`

| ID | Caso | Cenario | Resultado esperado |
| --- | --- | --- | --- |
| BE-ROT-01 | Calcular distancia pelas ruas com retorno | Duas entregas sao posicionadas em um mapa 2D. | Usa distancia Manhattan entre pontos e inclui o retorno ao hangar. |
| BE-ROT-02 | Escolher menor ordem de visita | A lista de entrada informa primeiro o destino mais distante. | A rota visita primeiro o destino proximo, produz a menor distancia e aguarda inicio. |
| BE-ROT-03 | Calcular sem hangar existente | O hangar do drone nao e encontrado. | Retorna distancia zero sem tentar planejar uma rota invalida. |
| BE-ROT-04 | Planejar sem entregas | O drone possuia uma rota anterior, mas recebe lista vazia. | Limpa destinos, distancia, status e horarios da rota. |

## Frontend

### AuthContext.test.jsx

Arquivo: `frontend/src/context/AuthContext.test.jsx`

| ID | Caso | Cenario | Resultado esperado |
| --- | --- | --- | --- |
| FE-AUT-01 | Aceitar sessao valida | O JWT possui expiracao futura. | Considera o token valido e permite abrir a dashboard. |
| FE-AUT-02 | Rejeitar sessao expirada | O JWT possui expiracao anterior ao horario atual. | Considera o token invalido e direciona para o login. |
| FE-AUT-03 | Rejeitar token sem expiracao | O JWT nao possui o campo `exp`. | Considera o token invalido. |
| FE-AUT-04 | Rejeitar token malformado | O valor esta vazio, sem payload ou com JSON invalido. | Considera o token invalido sem lancar erro. |

### RemainingTime.test.jsx

Arquivo: `frontend/src/components/RemainingTime.test.jsx`

Relogio fixo utilizado pelos testes: `2026-01-01T12:00:00.000Z`.

| ID | Caso | Cenario | Resultado esperado |
| --- | --- | --- | --- |
| FE-TEM-01 | Formatar duracao | Sao fornecidos 0, 3661 e 86399 segundos. | Retorna respectivamente `00:00:00`, `01:01:01` e `23:59:59`. |
| FE-TEM-02 | Calcular segundos restantes | Sao usadas datas futura, passada e ausente. | Retorna os segundos futuros e nunca retorna valor negativo. |
| FE-TEM-03 | Atualizar contador | O termino esta a tres segundos e o relogio avanca dois segundos. | A tela muda de `00:00:03` para `00:00:01`. |
| FE-TEM-04 | Exibir conclusao | O termino esta a um segundo e o relogio avanca esse periodo. | Exibe `Concluindo...`. |
| FE-TEM-05 | Renderizar sem previsao | Nao existe horario estimado. | O componente nao renderiza conteudo. |

### errorMessage.test.js

Arquivo: `frontend/src/utils/errorMessage.test.js`

| ID | Caso | Cenario | Resultado esperado |
| --- | --- | --- | --- |
| FE-ERR-01 | Erro sem dados do servidor | A resposta nao possui `data`. | Retorna a mensagem alternativa informada. |
| FE-ERR-02 | Erro textual | O servidor retorna uma string. | Exibe a propria string retornada pelo servidor. |
| FE-ERR-03 | Erros de campos | A resposta possui mensagens para nome e peso. | Combina as mensagens dos campos em um unico texto. |
| FE-ERR-04 | Validacao sem detalhes de campos | A resposta possui mensagem geral e mapa de campos vazio. | Retorna a mensagem geral. |
| FE-ERR-05 | Formato de erro desconhecido | A resposta nao possui string, mensagem ou campos reconhecidos. | Retorna a mensagem alternativa padrao. |

## Convencoes

- `400 Bad Request`: a requisicao viola uma validacao ou regra de negocio.
- `403 Forbidden`: o recurso existe, mas pertence a outro usuario.
- `404 Not Found`: o recurso solicitado nao existe.
- Testes negativos verificam tambem que repositorios e servicos nao recebem
  chamadas de escrita quando a operacao e recusada.
- Comparacoes de recarga usam tolerancia pequena porque o tempo continua
  avancando durante a execucao do teste.

## Manutencao

Ao adicionar ou alterar uma regra:

1. Adicione ao menos um caso de sucesso e um caso de erro relevante.
2. Nomeie o metodo pelo comportamento esperado.
3. Evite conexoes externas; use mocks para repositorios e integracoes.
4. Atualize a tabela da suite correspondente neste documento.
5. Execute backend e frontend antes de concluir a alteracao.
