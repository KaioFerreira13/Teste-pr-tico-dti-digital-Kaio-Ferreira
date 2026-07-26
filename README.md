# Fretes Drones

Sistema de gestão de fretes para uma operação logística com drones. A aplicação
permite cadastrar hangares, modelos, drones e entregas, preparar despachos,
acompanhar rotas em um mapa cartesiano e cadastrar áreas que devem ser evitadas.

## Funcionalidades

- autenticação de usuários com JWT;
- cadastro e gerenciamento de hangares, modelos, drones e entregas;
- separação e alocação de entregas conforme peso, autonomia e bateria;
- indicação do motivo de inviabilidade por peso, distância ou área restrita;
- planejamento da menor rota com retorno ao hangar;
- desvio de áreas restritas com margem mínima de uma coordenada;
- acompanhamento de drones, entregas, bateria e recarga;
- visualização da cidade, hangares, rotas e alertas;
- editor de áreas inviáveis, em construção ou inseguras;
- interface responsiva para dispositivos móveis.

## Arquitetura

O projeto é dividido em duas aplicações:

```text
Frontend React → API REST Spring Boot → Spring Data → MongoDB
                         ↑
                    Segurança JWT
```

- `frontend/`: aplicação React criada com Vite.
- `backend/`: API Java com Spring Boot e Maven Wrapper.
- `docs/`: documentação técnica, testes e registros de uso de IA.

A descrição detalhada das classes, camadas e relacionamentos está em
[Arquitetura e relações entre classes](docs/architecture/ARQUITETURA_E_RELACOES_ENTRE_CLASSES.md).

## Tecnologias

### Frontend

- React 19;
- Vite 8;
- React Router;
- Tailwind CSS 4;
- HeroUI;
- Bootstrap Icons;
- Framer Motion;
- Axios;
- Vitest;
- Testing Library;
- jsdom;
- Oxlint.

### Backend

- Java 21;
- Spring Boot 4;
- Spring Web MVC;
- Spring Security;
- Spring Data MongoDB;
- Bean Validation;
- JWT com JJWT;
- Lombok;
- spring-dotenv;
- Maven;
- JUnit 5 e Mockito.

### Infraestrutura

- Docker;
- MongoDB;
- Render para hospedagem da API;
- Vercel para hospedagem do frontend.

## Pré-requisitos

Para iniciar o projeto localmente:

- Node.js com npm;
- Docker;
- uma instância MongoDB acessível localmente ou na nuvem.

O backend é compilado dentro do Docker. Portanto, não é necessário instalar
Java ou Maven na máquina para a execução normal descrita abaixo.

## Configuração

### Backend

Crie `backend/.env` a partir do exemplo:

```powershell
Copy-Item backend/.env.example backend/.env
```

No Linux ou macOS:

```bash
cp backend/.env.example backend/.env
```

Preencha as variáveis:

```dotenv
MONGODB_URI=mongodb+srv://USUARIO:SENHA@cluster.mongodb.net/fretes_drones
JWT_SECRET=gere-uma-chave-aleatoria-longa-e-segura
CORS_ALLOWED_ORIGINS=http://localhost:5173
PORT=8080
```

Não envie o arquivo `.env` nem credenciais reais ao repositório.

### Frontend

Crie `frontend/.env` a partir de `frontend/.env.example`:

```dotenv
VITE_API_URL=http://localhost:8080/api
```

## Como executar

### 1. Iniciar o backend com Docker

Na raiz do repositório, construa a imagem:

```bash
docker build -t fretes-drones-api ./backend
```

Inicie o container:

```bash
docker run --rm --name fretes-drones-api \
  -p 8080:8080 \
  --env-file ./backend/.env \
  fretes-drones-api
```

No PowerShell, o mesmo comando pode ser executado em uma linha:

```powershell
docker run --rm --name fretes-drones-api -p 8080:8080 --env-file ./backend/.env fretes-drones-api
```

Confirme que a API está disponível:

```text
GET http://localhost:8080/api/health
```

### 2. Iniciar o frontend com npm

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Abra:

```text
http://localhost:5173
```

## Comandos úteis

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm test
npm run test:watch
```

Backend, quando Java 21 estiver instalado localmente:

```bash
cd backend
./mvnw test
./mvnw spring-boot:run
```

No Windows PowerShell:

```powershell
cd backend
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

## Testes automatizados

O projeto possui 93 casos automatizados:

- 65 testes no backend;
- 28 testes no frontend.

Consulte o [Catálogo de casos de teste](docs/testing/CATALOGO_DE_CASOS_DE_TESTE.md)
para ver os cenários e regras cobertos.

## Uso de inteligência artificial

As seguintes IAs apoiaram o desenvolvimento:

- **Claude:** definição da arquitetura, consultas sobre tecnologias e auxílio na
  tomada de decisões;
- **GPT:** escrita e evolução do código, testes e documentação.

Os registros de apoio estão organizados em:

- [Regras para uso de IA](docs/ai/RULES.md);
- [Memórias e contexto do projeto](docs/ai/MEMORIAS.md);
- [Prompts utilizados](docs/ai/PROMPTS.md).

Esses arquivos registram diretrizes, contexto técnico e modelos de solicitação.
Eles não armazenam credenciais, dados pessoais ou raciocínio privado das
ferramentas.

## Documentos importantes

- [Arquitetura e relações entre classes](docs/architecture/ARQUITETURA_E_RELACOES_ENTRE_CLASSES.md);
- [Catálogo de casos de teste](docs/testing/CATALOGO_DE_CASOS_DE_TESTE.md);
- [Regras para uso de IA](docs/ai/RULES.md);
- [Memórias e contexto](docs/ai/MEMORIAS.md);
- [Prompts de desenvolvimento](docs/ai/PROMPTS.md);
- [Configuração de deploy da API](render.yaml);
- [Exemplo de ambiente do backend](backend/.env.example);
- [Exemplo de ambiente do frontend](frontend/.env.example).

## Segurança

- nunca registre arquivos `.env` no Git;
- utilize um `JWT_SECRET` longo e aleatório;
- limite `CORS_ALLOWED_ORIGINS` aos endereços realmente autorizados;
- não inclua tokens, senhas ou dados reais nos prompts e documentos de IA.

## Licença

Consulte o arquivo [LICENSE](LICENSE).
