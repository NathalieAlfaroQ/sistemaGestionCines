import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Salas from "./pages/Sedes";

function App() {
  return (

    <div className="flex min-h-screen flex-col pb-40 bg-background">

      <Navbar />

      <main className="mx-auto w-[85%] pt-28 flex-1">
        <Salas />
      </main>

      <Footer />
    </div>
  );
}

export default App;

