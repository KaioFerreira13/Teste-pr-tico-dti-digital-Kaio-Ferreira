# Memórias e contexto do projeto

Este arquivo reúne o contexto estável usado nas interações com ferramentas de
IA. Ele funciona como referência técnica e não representa memória interna ou
raciocínio privado de nenhum modelo.

## Objetivo

Construir uma aplicação de gestão de entregas por drones em uma cidade
representada por coordenadas cartesianas inteiras.

## Arquitetura adotada

- frontend SPA em React e Vite;
- estilização com Tailwind CSS, HeroUI e Bootstrap Icons;
- backend REST em Java 21 e Spring Boot;
- autenticação stateless com JWT;
- persistência documental com MongoDB;
- DTOs e mappers entre API e domínio;
- services responsáveis pelas regras de negócio;
- execução do backend em container Docker.

## Conceitos principais

- `User` delimita a propriedade dos dados;
- `Hangar` representa a origem e o retorno das rotas;
- `Modelo` define autonomia, peso máximo e velocidade;
- `Drone` mantém capacidade, bateria, estado e dados da rota;
- `Entrega` contém peso, prioridade, destino, estado e motivo de inviabilidade;
- `AlertArea` representa zonas inviáveis, em construção ou inseguras.

## Decisões de rota

- o mapa é tratado como uma matriz 2D;
- a distância segue o deslocamento pelas coordenadas do mapa;
- a rota deve visitar as entregas e retornar ao hangar;
- a ordem escolhida deve minimizar a distância;
- áreas restritas devem ser contornadas;
- o caminho deve permanecer pelo menos uma coordenada distante da área;
- destino dentro de área restrita torna a entrega inviável.

## Decisões de interface

- o mapa principal inicia centralizado no hangar;
- no mobile, o mapa é aberto sob demanda;
- cartões de entrega podem destacar a rota correspondente;
- drones em rota são representados pela imagem `drone.png`;
- mapas, listas e modais devem permanecer responsivos;
- listas extensas usam rolagem interna;
- textos sobrepostos ao mapa não devem ser selecionáveis;
- a visualização da cidade mostra hangares e áreas cadastradas.

## Decisões sobre alertas

- tipos: inviável, construção e insegura;
- cores: cinza, amarelo e vermelho, respectivamente;
- ícones: `ban`, `buildings-fill` e `exclamation-triangle-fill`;
- coordenadas são inteiras;
- a descrição é obrigatória;
- áreas não podem conter hangares nem sobrepor outras áreas;
- pontos e arestas podem ser ajustados antes de salvar.

## Estratégia de testes

- backend com JUnit 5 e Mockito;
- frontend com Vitest, Testing Library e jsdom;
- testes sem dependência de serviços externos;
- cobertura de cenários positivos, negativos, autorização e ausência de escrita
  quando uma operação é recusada;
- catálogo atual: 65 casos no backend e 28 no frontend.

## Registro das IAs

- Claude foi utilizado para arquitetura, dúvidas tecnológicas e suporte a decisões;
- GPT foi utilizado para escrita de código, testes e documentação.
