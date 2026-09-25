import Navbar from './components/Navbar'
import Footer from './components/Footer'

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[#1f1f22]">

      <Navbar />

      <main className="flex-1">
        {/* Aquí construiremos posteriormente el contenido */}
      </main>

      <Footer />

    </div>
  )
}

export default App
