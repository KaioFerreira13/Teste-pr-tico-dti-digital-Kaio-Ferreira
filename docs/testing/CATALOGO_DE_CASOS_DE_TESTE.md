# Catálogo de casos de testes cobertos

Inventário consolidado das validações automatizadas do projeto.

## Resumo

| Camada | Suítes | Casos | Resultado em 26/07/2026 |
| --- | ---: | ---: | --- |
| Backend | 16 | 65 | 65 aprovados |
| Frontend | 7 | 28 | 28 aprovados |
| **Total** | **23** | **93** | **93 aprovados, 0 falhas** |

## Como executar

```powershell
cd backend
.\mvnw.cmd test
cd ..\frontend
npm test
```

## Backend

### Áreas de alerta e restrições

Suíte: `AlertAreaControllerBusinessRulesTest`  
Arquivo: `backend/src/test/java/com/dtidigital/fretesdrones/controller/AlertAreaControllerBusinessRulesTest.java`  
Cobertura: Criação, arredondamento de coordenadas, descrição, proteção de hangares, sobreposição, atualização e autorização de exclusão.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| BE-ALT-01 | `createsAreaWithRoundedCoordinatesAndDescription` | A operação é concluída com os dados e efeitos persistidos esperados. |
| BE-ALT-02 | `refusesAreaContainingHangarIncludingItsBorder` | A operação inválida é recusada e não produz alteração indevida. |
| BE-ALT-03 | `refusesOverlappingAreaButAllowsTouchingBorders` | A operação inválida é recusada e não produz alteração indevida. |
| BE-ALT-04 | `updatesAreaWithoutTreatingItselfAsOverlap` | A operação é concluída com os dados e efeitos persistidos esperados. |
| BE-ALT-05 | `refusesDeletingAreaOwnedByAnotherUser` | A operação inválida é recusada e não produz alteração indevida. |

### Cadastro de hangares e modelos

Suíte: `CadastroBusinessRulesTest`  
Arquivo: `backend/src/test/java/com/dtidigital/fretesdrones/controller/CadastroBusinessRulesTest.java`  
Cobertura: Unicidade de coordenadas e nomes, propriedade do recurso e tratamento de registros inexistentes.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| BE-CAD-01 | `refusesCreatingTwoHangarsAtSamePosition` | A operação inválida é recusada e não produz alteração indevida. |
| BE-CAD-02 | `refusesMovingHangarToOccupiedPosition` | A operação inválida é recusada e não produz alteração indevida. |
| BE-CAD-03 | `refusesChangingHangarOwnedByAnotherUser` | A operação inválida é recusada e não produz alteração indevida. |
| BE-CAD-04 | `refusesDeletingHangarOwnedByAnotherUser` | A operação inválida é recusada e não produz alteração indevida. |
| BE-CAD-05 | `returnsNotFoundForUnknownHangar` | O valor calculado ou retornado corresponde ao cenário configurado. |
| BE-CAD-06 | `refusesDuplicateModelNameForSameUser` | A operação inválida é recusada e não produz alteração indevida. |
| BE-CAD-07 | `refusesRenamingModelToExistingName` | A operação inválida é recusada e não produz alteração indevida. |
| BE-CAD-08 | `refusesChangingModelOwnedByAnotherUser` | A operação inválida é recusada e não produz alteração indevida. |
| BE-CAD-09 | `refusesDeletingModelOwnedByAnotherUser` | A operação inválida é recusada e não produz alteração indevida. |
| BE-CAD-10 | `returnsNotFoundForUnknownModel` | O valor calculado ou retornado corresponde ao cenário configurado. |

### Operações e estados dos drones

Suíte: `DroneControllerBusinessRulesTest`  
Arquivo: `backend/src/test/java/com/dtidigital/fretesdrones/controller/DroneControllerBusinessRulesTest.java`  
Cobertura: Transições manuais, estados automáticos, autorização, início de rota, bateria e seleção de entregas.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| BE-DRN-01 | `refusesManualStatusChangeWhileDroneIsDispatching` | A operação inválida é recusada e não produz alteração indevida. |
| BE-DRN-02 | `refusesSettingAnAutomaticStatusManually` | A operação inválida é recusada e não produz alteração indevida. |
| BE-DRN-03 | `allowsChangingFromMaintenanceToAvailable` | O cenário válido é aceito e seu fluxo é concluído. |
| BE-DRN-04 | `refusesUnknownDroneStatus` | A operação inválida é recusada e não produz alteração indevida. |
| BE-DRN-05 | `refusesChangingDroneOwnedByAnotherUser` | A operação inválida é recusada e não produz alteração indevida. |
| BE-DRN-06 | `refusesStartingFreightWithoutPendingRoute` | A operação inválida é recusada e não produz alteração indevida. |
| BE-DRN-07 | `refusesStartingRouteWhenBatteryCannotCoverIt` | A operação inválida é recusada e não produz alteração indevida. |
| BE-DRN-08 | `refusesBulkRemovalWithoutSelectedDeliveries` | A operação inválida é recusada e não produz alteração indevida. |
| BE-DRN-09 | `refusesResettingDroneOwnedByAnotherUser` | A operação inválida é recusada e não produz alteração indevida. |

### Operações com entregas

Suíte: `EntregaControllerBusinessRulesTest`  
Arquivo: `backend/src/test/java/com/dtidigital/fretesdrones/controller/EntregaControllerBusinessRulesTest.java`  
Cobertura: Confirmação, tratamento de inviabilidade, autorização, prioridade, edição e divisão de carga.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| BE-ENT-01 | `refusesConfirmationWithoutDeliveries` | A operação inválida é recusada e não produz alteração indevida. |
| BE-ENT-02 | `refusesConfirmationWhileAnInfeasibleDeliveryIsUntreated` | A operação inválida é recusada e não produz alteração indevida. |
| BE-ENT-03 | `refusesDeliveryFromAnotherUserDuringConfirmation` | A operação inválida é recusada e não produz alteração indevida. |
| BE-ENT-04 | `refusesMovingDeliveryThatWasAlreadyDispatched` | A operação inválida é recusada e não produz alteração indevida. |
| BE-ENT-05 | `refusesInvalidPriorityWhenCreatingDelivery` | A operação inválida é recusada e não produz alteração indevida. |
| BE-ENT-06 | `refusesEditingDispatchedDelivery` | A operação inválida é recusada e não produz alteração indevida. |
| BE-ENT-07 | `refusesEditingDeliveryOwnedByAnotherUser` | A operação inválida é recusada e não produz alteração indevida. |
| BE-ENT-08 | `refusesSplittingWhenPartitionSumDiffersFromOriginalWeight` | A operação inválida é recusada e não produz alteração indevida. |
| BE-ENT-09 | `refusesSplitWithLessThanTwoPositivePartitions` | A operação inválida é recusada e não produz alteração indevida. |
| BE-ENT-10 | `refusesSplittingDeliveryOwnedByAnotherUser` | A operação inválida é recusada e não produz alteração indevida. |

### Saúde da aplicação

Suíte: `HealthControllerTest`  
Arquivo: `backend/src/test/java/com/dtidigital/fretesdrones/controller/HealthControllerTest.java`  
Cobertura: Disponibilidade básica, verificação do banco e delegação do keep-alive.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| BE-HLT-01 | `returnsBasicHealthWithoutHittingDatabase` | O valor calculado ou retornado corresponde ao cenário configurado. |
| BE-HLT-02 | `keepAliveTouchesDatabaseAndReportsDbStatus` | O estado final e as integrações acionadas correspondem ao comportamento esperado. |
| BE-HLT-03 | `keepAliveDelegatesToDatabaseHealth` | O estado final e as integrações acionadas correspondem ao comportamento esperado. |

### Cálculo de rotas

Suíte: `RouteCalculatorTest`  
Arquivo: `backend/src/test/java/com/dtidigital/fretesdrones/routing/RouteCalculatorTest.java`  
Cobertura: Distância Manhattan, retorno ao hangar, ordenação de destinos e desvio mínimo de áreas restritas.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| BE-CAL-01 | `calculatesStreetDistanceIncludingReturnToOrigin` | O valor calculado ou retornado corresponde ao cenário configurado. |
| BE-CAL-02 | `choosesShortestOrderInsteadOfInputOrder` | O sistema seleciona e mantém somente os dados compatíveis com a regra. |
| BE-CAL-03 | `returnsEmptyPlanWhenThereAreNoDeliveries` | O valor calculado ou retornado corresponde ao cenário configurado. |
| BE-CAL-04 | `choosesShortestDetourKeepingOneCoordinateAwayFromRestrictedArea` | O sistema seleciona e mantém somente os dados compatíveis com a regra. |

### Autenticação e cadastro de usuário

Suíte: `AuthServiceTest`  
Arquivo: `backend/src/test/java/com/dtidigital/fretesdrones/service/AuthServiceTest.java`  
Cobertura: Login, conversão de falhas, e-mail duplicado, codificação de senha e perfil inicial.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| BE-AUT-01 | `authenticatesAndReturnsGeneratedToken` | O cenário válido é aceito e seu fluxo é concluído. |
| BE-AUT-02 | `convertsAuthenticationFailureToDomainSpecificException` | O estado final e as integrações acionadas correspondem ao comportamento esperado. |
| BE-AUT-03 | `refusesRegisteringDuplicateEmail` | A operação inválida é recusada e não produz alteração indevida. |
| BE-AUT-04 | `encodesPasswordAndRegistersUserRole` | A operação é concluída com os dados e efeitos persistidos esperados. |

### Alocação e inviabilidade de entregas

Suíte: `DeliveryAllocationServiceTest`  
Arquivo: `backend/src/test/java/com/dtidigital/fretesdrones/service/DeliveryAllocationServiceTest.java`  
Cobertura: Agrupamento, melhor uso da capacidade e motivos de inviabilidade por peso, distância e área restrita.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| BE-ALO-01 | `groupsMultipleDeliveriesInSameDroneWhenIdleDroneCannotFit` | O sistema seleciona e mantém somente os dados compatíveis com a regra. |
| BE-ALO-02 | `selectsTightestCapacityFit` | O sistema seleciona e mantém somente os dados compatíveis com a regra. |
| BE-ALO-03 | `marksDeliveryInfeasibleWhenNoDroneSupportsItsWeight` | A classificação e o motivo resultantes correspondem às regras de negócio. |
| BE-ALO-04 | `marksDeliveryInfeasibleWhenDestinationIsInsideRestrictedArea` | A classificação e o motivo resultantes correspondem às regras de negócio. |
| BE-ALO-05 | `marksDeliveryInfeasibleWhenFullAutonomyCannotCoverRoute` | A classificação e o motivo resultantes correspondem às regras de negócio. |
| BE-ALO-06 | `keepsDeliveryConfirmedWhenCurrentBatteryIsInsufficientButFullAutonomyWorks` | O sistema seleciona e mantém somente os dados compatíveis com a regra. |
| BE-ALO-07 | `ignoresDronesThatAreNotAvailable` | O sistema seleciona e mantém somente os dados compatíveis com a regra. |

### Conclusão de entregas

Suíte: `DeliveryCompletionServiceTest`  
Arquivo: `backend/src/test/java/com/dtidigital/fretesdrones/service/DeliveryCompletionServiceTest.java`  
Cobertura: Conclusão seletiva de entregas cujo horário estimado já foi atingido.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| BE-CON-01 | `completesOnlyDeliveriesWhoseEstimatedTimeHasPassed` | O estado final e as integrações acionadas correspondem ao comportamento esperado. |

### Gestão de entregas

Suíte: `DeliveryManagementServiceTest`  
Arquivo: `backend/src/test/java/com/dtidigital/fretesdrones/service/DeliveryManagementServiceTest.java`  
Cobertura: Preparação do despacho antes da leitura dos dados operacionais atualizados.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| BE-GES-01 | `preparesDispatchBeforeReadingUpdatedManagementData` | O estado final e as integrações acionadas correspondem ao comportamento esperado. |

### Agendamento operacional

Suíte: `DeliveryOperationsSchedulerTest`  
Arquivo: `backend/src/test/java/com/dtidigital/fretesdrones/service/DeliveryOperationsSchedulerTest.java`  
Cobertura: Coordenação dos serviços periódicos usando uma única referência temporal.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| BE-SCH-01 | `coordinatesOperationsUsingTheSameReferenceTime` | O estado final e as integrações acionadas correspondem ao comportamento esperado. |

### Viabilidade de entregas

Suíte: `DeliveryViabilityServiceTest`  
Arquivo: `backend/src/test/java/com/dtidigital/fretesdrones/service/DeliveryViabilityServiceTest.java`  
Cobertura: Avaliação combinada de peso e distância completa de ida e volta.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| BE-VIA-01 | `considersWeightAndRoundTripDistance` | A classificação e o motivo resultantes correspondem às regras de negócio. |

### Recarga de drones

Suíte: `DroneChargingServiceTest`  
Arquivo: `backend/src/test/java/com/dtidigital/fretesdrones/service/DroneChargingServiceTest.java`  
Cobertura: Progressão da bateria, inicialização da recarga, retorno à disponibilidade e nova alocação.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| BE-REC-01 | `gainsThreePercentPerMinute` | O estado final e as integrações acionadas correspondem ao comportamento esperado. |
| BE-REC-02 | `fullyChargedDroneBecomesAvailableAndTriggersAllocation` | O estado final e as integrações acionadas correspondem ao comportamento esperado. |
| BE-REC-03 | `missingChargingTimestampIsInitialized` | O estado final e as integrações acionadas correspondem ao comportamento esperado. |
| BE-REC-04 | `fullBatteryWithoutTimestampStillBecomesAvailable` | O estado final e as integrações acionadas correspondem ao comportamento esperado. |

### Consumo de bateria em voo

Suíte: `DroneFlightBatteryServiceTest`  
Arquivo: `backend/src/test/java/com/dtidigital/fretesdrones/service/DroneFlightBatteryServiceTest.java`  
Cobertura: Consumo proporcional ao avanço temporal da rota.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| BE-BAT-01 | `decreasesBatteryProportionallyToFlightProgress` | O estado final e as integrações acionadas correspondem ao comportamento esperado. |

### Finalização da rota

Suíte: `RouteCompletionServiceTest`  
Arquivo: `backend/src/test/java/com/dtidigital/fretesdrones/service/RouteCompletionServiceTest.java`  
Cobertura: Consumo final da bateria, limpeza da carga e início automático da recarga.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| BE-FIM-01 | `finishedRouteConsumesBatteryAndStartsCharging` | O estado final e as integrações acionadas correspondem ao comportamento esperado. |

### Planejamento de rota

Suíte: `RoutePlanningServiceTest`  
Arquivo: `backend/src/test/java/com/dtidigital/fretesdrones/service/RoutePlanningServiceTest.java`  
Cobertura: Persistência do plano, ausência de hangar e limpeza do plano sem entregas.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| BE-PLN-01 | `appliesCalculatedPlanToDroneAndPersistsIt` | O estado final e as integrações acionadas correspondem ao comportamento esperado. |
| BE-PLN-02 | `returnsZeroWhenHangarDoesNotExist` | O valor calculado ou retornado corresponde ao cenário configurado. |
| BE-PLN-03 | `clearsRouteWhenNoDeliveriesAreProvided` | O sistema seleciona e mantém somente os dados compatíveis com a regra. |

## Frontend

### Contagem regressiva

Suíte: `RemainingTime.test`  
Arquivo: `frontend/src/test/components/RemainingTime.test.jsx`  
Cobertura: Formatação, atualização por segundo, limite zero, conclusão e ausência de previsão.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| FE-TEM-01 | `formats seconds as hours, minutes and seconds` | O valor calculado ou retornado corresponde ao cenário configurado. |
| FE-TEM-02 | `calculates remaining seconds and never returns a negative value` | O valor calculado ou retornado corresponde ao cenário configurado. |
| FE-TEM-03 | `updates the visible countdown every second` | A operação é concluída com os dados e efeitos persistidos esperados. |
| FE-TEM-04 | `shows completion state when time reaches zero` | A interface apresenta o conteúdo esperado para a entrada simulada. |
| FE-TEM-05 | `renders nothing without an estimated completion date` | A interface apresenta o conteúdo esperado para a entrada simulada. |

### Sessão do usuário

Suíte: `AuthContext.test`  
Arquivo: `frontend/src/test/context/AuthContext.test.jsx`  
Cobertura: Aceitação e rejeição de JWT conforme expiração, estrutura e conteúdo.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| FE-SES-01 | `accepts a session token that has not expired` | O cenário válido é aceito e seu fluxo é concluído. |
| FE-SES-02 | `rejects an expired session token` | A operação inválida é recusada e não produz alteração indevida. |
| FE-SES-03 | `rejects a token without expiration` | A operação inválida é recusada e não produz alteração indevida. |
| FE-SES-04 | `rejects malformed and empty tokens` | A operação inválida é recusada e não produz alteração indevida. |

### Integração frontend com alertas

Suíte: `alertService.test`  
Arquivo: `frontend/src/test/services/alertService.test.js`  
Cobertura: Listagem, criação, atualização e exclusão pelo endpoint protegido de alertas.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| FE-ALT-01 | `lists alert areas from the protected endpoint` | O estado final e as integrações acionadas correspondem ao comportamento esperado. |
| FE-ALT-02 | `creates and updates alert areas with the provided payload` | A operação é concluída com os dados e efeitos persistidos esperados. |
| FE-ALT-03 | `deletes an alert area by id` | A operação é concluída com os dados e efeitos persistidos esperados. |

### Validação de autenticação

Suíte: `authValidation.test`  
Arquivo: `frontend/src/test/services/authValidation.test.js`  
Cobertura: Credenciais de login, formato do e-mail e política de senha no cadastro.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| FE-VAL-01 | `accepts valid login credentials without requiring a new password policy` | O cenário válido é aceito e seu fluxo é concluído. |
| FE-VAL-02 | `rejects malformed email addresses` | A operação inválida é recusada e não produz alteração indevida. |
| FE-VAL-03 | `requires a strong password during registration` | O estado final e as integrações acionadas correspondem ao comportamento esperado. |
| FE-VAL-04 | `accepts registration when every password requirement is satisfied` | O cenário válido é aceito e seu fluxo é concluído. |

### Indicadores do dashboard

Suíte: `dashboardService.test`  
Arquivo: `frontend/src/test/services/dashboardService.test.js`  
Cobertura: Métricas de entregas, ranking, estados operacionais e carga dos drones.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| FE-DSH-01 | `calculates delivery metrics and drone ranking` | O valor calculado ou retornado corresponde ao cenário configurado. |
| FE-DSH-02 | `summarizes operational drone states and load` | O valor calculado ou retornado corresponde ao cenário configurado. |

### Regras de entrega no frontend

Suíte: `deliveryService.test`  
Arquivo: `frontend/src/test/services/deliveryService.test.js`  
Cobertura: Agrupamento, prioridade e identificação dos motivos de inviabilidade por peso, distância ou área restrita.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| FE-ENT-01 | `groups deliveries using the provided status definitions` | O sistema seleciona e mantém somente os dados compatíveis com a regra. |
| FE-ENT-02 | `keeps editable deliveries ordered by priority` | O sistema seleciona e mantém somente os dados compatíveis com a regra. |
| FE-ENT-03 | `marks a delivery as viable only when a drone supports its route and weight` | A classificação e o motivo resultantes correspondem às regras de negócio. |
| FE-ENT-04 | `identifies distance and combined viability restrictions` | A classificação e o motivo resultantes correspondem às regras de negócio. |
| FE-ENT-05 | `marks a destination inside a restricted area with its specific reason` | A classificação e o motivo resultantes correspondem às regras de negócio. |

### Mensagens de erro

Suíte: `errorMessage.test`  
Arquivo: `frontend/src/test/utils/errorMessage.test.js`  
Cobertura: Fallback, mensagens simples, erros por campo e formatos desconhecidos de resposta.

| ID | Caso automatizado | Resultado esperado |
| --- | --- | --- |
| FE-ERR-01 | `returns the fallback when the server has no response data` | O valor calculado ou retornado corresponde ao cenário configurado. |
| FE-ERR-02 | `returns a plain server message` | O valor calculado ou retornado corresponde ao cenário configurado. |
| FE-ERR-03 | `combines field validation messages` | A interface apresenta o conteúdo esperado para a entrada simulada. |
| FE-ERR-04 | `uses the general message when field errors are empty` | A interface apresenta o conteúdo esperado para a entrada simulada. |
| FE-ERR-05 | `uses fallback for an unknown response shape` | A interface apresenta o conteúdo esperado para a entrada simulada. |

## Observações

- O inventário é derivado diretamente dos testes existentes no repositório.
- A execução integral em 26/07/2026 aprovou todos os 93 casos.
