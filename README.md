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