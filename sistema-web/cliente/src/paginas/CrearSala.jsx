import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearSala } from '../servicios/servicioSalas.js';
import FormularioSala from '../componentes/FormularioSala.jsx';
import Modal from '../common/Modal.jsx';

function CrearSala() {
  const navegar = useNavigate();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [creada, setCreada] = useState(false);

  async function guardar(sala) {
    setGuardando(true);
    setError(null);

    try {
      await crearSala(sala);
      setCreada(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setGuardando(false);
    }
  }

  const volverALista = () => navegar('/salas');

  return (
    <main className="flex-1 bg-background text-text-color">
      <div className="max-w-screen-2xl mx-auto px-8 py-8">
        <h1 className="mb-8 text-4xl font-bold">Crear sala</h1>

        <FormularioSala
          alEnviar={guardar}
          alCancelar={volverALista}
          guardando={guardando}
          error={error}
        />
      </div>

      {creada && (
        <Modal
          mensaje="Sala creada con éxito"
          botones={[{ texto: 'Continuar', alPulsar: volverALista }]}
        />
      )}
    </main>
  );
}

export default CrearSala;
