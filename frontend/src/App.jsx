import './App.css'

const setupItems = [
  'React configurado com Vite',
  'Backend Spring Boot preparado com Maven',
  'Domínio inicial baseado no diagrama de classes',
  'Mapa urbano previsto como matriz 2D simples',
]

function App() {
  return (
    <main className="app-shell">
      <section className="intro">
        <p className="eyebrow">Gestao de fretes com drones</p>
        <h1>Base inicial do sistema preparada</h1>
        <p className="summary">
          Ambiente pronto para construir os fluxos de hangares, drones, modelos
          e entregas a partir das proximas funcionalidades.
        </p>
      </section>

      <section className="status-panel" aria-label="Status do ambiente">
        {setupItems.map((item) => (
          <article className="status-item" key={item}>
            <span aria-hidden="true">OK</span>
            <p>{item}</p>
          </article>
        ))}
      </section>
    </main>
  )
}

export default App
