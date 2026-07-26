# Prompts utilizados no desenvolvimento

Este documento consolida os tipos de prompts utilizados durante o
desenvolvimento.

## Arquitetura — Claude

```text
Analise os requisitos de um sistema de entregas com drones e proponha uma
arquitetura em camadas usando React, Spring Boot e MongoDB. Separe controllers,
services, repositories, DTOs, mappers, segurança e cálculo de rotas. Explique
responsabilidades, relações e principais decisões.
```

```text
Compare alternativas para representar hangares, drones, entregas e áreas
restritas em MongoDB. Considere referências por identificador, propriedade por
usuário, consistência e simplicidade de manutenção.
```

## Dúvidas tecnológicas — Claude

```text
Explique como implementar autenticação JWT stateless no Spring Security e quais
cuidados tomar com CORS, expiração, autorização e armazenamento do token no
frontend.
```

```text
Avalie estratégias para calcular a menor rota em uma matriz 2D, incluindo
retorno ao ponto de origem e desvio de áreas retangulares com margem mínima.
Apresente os custos e limitações de cada estratégia.
```

```text
Compare formas de construir um editor visual de áreas retangulares em React,
permitindo criação, arraste de pontos, ajuste de arestas, edição de coordenadas e
validação de sobreposição.
```

## Implementação — GPT

```text
Implemente a funcionalidade descrita respeitando a arquitetura existente.
Mantenha controllers enxutos, regras nos services, persistência nos repositories
e contratos nos DTOs. Preserve compatibilidade com o frontend e atualize os
testes automatizados.
```

```text
Adicione responsividade ao frontend. Em dispositivos móveis, o mapa deve ficar
oculto inicialmente e ser aberto sob demanda, sem prejudicar a experiência em
desktop.
```

```text
Implemente áreas de alerta no mapa com os tipos inviável, construção e insegura.
Permita criar, editar e excluir, valide descrição, coordenadas, hangares dentro
da área e sobreposição com áreas existentes.
```

```text
Atualize o cálculo da menor rota para contornar áreas restritas mantendo ao
menos uma coordenada de distância. Marque como inviável uma entrega cujo destino
esteja dentro de uma área.
```

```text
Crie e atualize testes unitários para as regras de áreas, rotas, alocação,
inviabilidade, autenticação e interface. Execute as suítes e documente todos os
casos cobertos.
```

## Revisão — GPT

```text
Verifique se a documentação corresponde ao código atual, aos scripts do
package.json, às dependências do pom.xml, às variáveis de ambiente e aos
comandos Docker. Não presuma recursos que não existam no repositório.
```

## Modelo de contexto para novas sessões

```text
Projeto: Fretes Drones.
Frontend: React, Vite, Tailwind CSS, HeroUI, Bootstrap Icons e Axios.
Backend: Java 21, Spring Boot, Spring Security, MongoDB, JWT e Lombok.
Regras centrais: propriedade por usuário, rotas com retorno ao hangar, desvio de
áreas restritas, alocação por peso/autonomia/bateria e motivos explícitos de
inviabilidade.
Antes de alterar, inspecione o código existente. Depois, execute testes e build
proporcionais ao impacto e atualize a documentação relacionada.
```
