import { useEffect, useState } from 'react'

function App() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((resData) => setData(resData))
      .catch((err) => console.error('Error al conectar con la API:', err))
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-sky-400 mb-4">Vite + React + Express</h1>
        <p className="text-slate-300 mb-6">Estado de la conexión con el Backend:</p>

        <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm border border-slate-800">
          {data ? (
            <div className="flex flex-col gap-1">
              <span className="text-emerald-400 font-bold">{data.message}</span>
              <span className="text-slate-400 text-xs">Hora servidor: {data.timestamp}</span>
            </div>
          ) : (
            <span className="text-amber-400 animate-pulse">Cargando respuesta del servidor...</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default App