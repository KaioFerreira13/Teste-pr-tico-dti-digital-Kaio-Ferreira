# Teste pratico dti digital - Kaio Ferreira

Sistema de gestao de fretes para uma startup de logistica focada em entregas
com drones. O mapa da cidade sera tratado como uma matriz 2D simples.

## Estrutura inicial

- `frontend/`: aplicacao web em React criada com Vite.
- `backend/`: API Java Spring Boot com Maven Wrapper.
- `Diagrama-de-Classes.jpg`: diagrama de classes usado como referencia inicial.

## Requisitos

- Node.js e npm
- Java 21 ou superior

Nao e necessario instalar Maven globalmente, pois o backend inclui Maven Wrapper.

## Testes

A descricao dos 54 casos automatizados, regras cobertas e comandos de execucao
esta em [`docs/TESTES.md`](docs/TESTES.md).

## Comandos

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
./mvnw spring-boot:run
```

No Windows PowerShell:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Endpoint inicial da API:

```text
GET http://localhost:8080/api/health
```

## Docker

Crie um arquivo `backend/.env` usando `backend/.env.example` como referencia.
Depois, na raiz do repositorio:

```powershell
docker build -t fretes-drones-api ./backend
docker run --rm -p 8080:8080 --env-file ./backend/.env fretes-drones-api
```

Verifique a aplicacao:

```text
GET http://localhost:8080/api/health
```

## Deploy no Render

O arquivo `render.yaml` permite criar o servico como um Render Blueprint.

1. Envie o repositorio para o GitHub.
2. No Render, escolha `New` e depois `Blueprint`.
3. Selecione o repositorio e confirme o servico `fretes-drones-api`.
4. Informe `MONGODB_URI` com a URI completa do MongoDB.
5. Informe `CORS_ALLOWED_ORIGINS` com a URL HTTPS do frontend. Para mais de
   uma origem, separe os enderecos por virgula e nao adicione barra no final.
6. O `JWT_SECRET` sera gerado automaticamente pelo Blueprint.
7. No MongoDB Atlas, permita conexoes originadas pelo Render.

O Render define `PORT` automaticamente. A aplicacao utiliza essa variavel e
expoe o health check publico em `/api/health`.

Variaveis:

| Variavel | Obrigatoria | Descricao |
| --- | --- | --- |
| `MONGODB_URI` | Sim | URI de conexao com o MongoDB e nome do banco. |
| `JWT_SECRET` | Sim | Chave longa e aleatoria usada para assinar tokens. |
| `CORS_ALLOWED_ORIGINS` | Sim | URLs autorizadas a acessar a API pelo navegador. |
| `PORT` | Nao | Porta HTTP; o Render fornece automaticamente. |
