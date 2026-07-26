# Regras para uso de IA

Este documento registra as diretrizes adotadas para utilizar inteligência
artificial no desenvolvimento do Fretes Drones.

## Responsabilidades

- decisões finais sobre arquitetura, regras de negócio e segurança pertencem ao
  desenvolvedor;
- toda sugestão gerada por IA deve ser revisada antes de entrar no código;
- mudanças devem respeitar a estrutura React/Spring Boot existente;
- o comportamento documentado deve refletir o código real do repositório.

## Qualidade do código

- manter controllers focados no contrato HTTP;
- concentrar regras de negócio nos services;
- utilizar repositories somente para persistência e consultas;
- utilizar DTOs e mappers para não expor entidades diretamente;
- manter componentes React pequenos e extrair integrações para `services/`;
- preservar responsividade e acessibilidade da interface;
- evitar duplicação e nomes genéricos;
- atualizar ou criar testes para cada nova regra relevante.

## Regras do domínio

- todo recurso deve respeitar o usuário proprietário;
- rotas devem considerar os destinos e o retorno ao hangar;
- áreas restritas devem ser evitadas com margem mínima de uma coordenada;
- uma área não pode conter um hangar;
- uma área não pode sobrepor outra área cadastrada;
- coordenadas de áreas devem ser arredondadas para o inteiro mais próximo;
- entregas inviáveis devem informar peso, distância, ambos ou área restrita,
  conforme a regra aplicável;
- bateria atual insuficiente não torna a entrega inviável quando a autonomia
  total do drone ainda atende à rota.

## Segurança e privacidade

- não enviar senhas, tokens, arquivos `.env` ou credenciais para ferramentas de IA;
- não copiar dados pessoais ou dados de produção para prompts;
- validar autenticação, autorização e propriedade dos recursos;
- revisar dependências antes da instalação;
- não executar comandos destrutivos sem conferir o alvo.

## Validação

Antes de considerar uma alteração concluída:

1. executar os testes relacionados;
2. executar a suíte completa quando a alteração afetar regras compartilhadas;
3. executar o build do frontend;
4. conferir mensagens de erro e cenários negativos;
5. atualizar README, arquitetura e catálogo de testes quando necessário.

## Papel das ferramentas

- **Claude:** apoio à definição arquitetural, pesquisa de dúvidas tecnológicas e
  comparação de alternativas para tomada de decisão;
- **GPT:** escrita e refatoração de código, criação de testes, implementação de
  interfaces e manutenção da documentação.

As respostas das ferramentas são insumos de trabalho, não uma fonte automática
de verdade.
