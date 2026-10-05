import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearSede } from '../servicios/servicioSedes.js';
import FormularioSede from '../componentes/FormularioSede.jsx';
import Modal from '../common/Modal.jsx';

function CrearSede() {
  const navegar = useNavigate();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [creada, setCreada] = useState(false);

  async function guardar(sede) {
    setGuardando(true);
    setError(null);

    try {
      await crearSede(sede);
      setCreada(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="flex-1 bg-background text-text-color">
      <div className="max-w-screen-2xl mx-auto px-8 py-8">
        <h1 className="mb-10 text-3xl font-bold">Crear Sede</h1>

        <FormularioSede
          alEnviar={guardar}
          alCancelar={() => navegar('/sedes')}
          guardando={guardando}
          error={error}
        />
      </div>

      {creada && (
        <Modal
          mensaje="Sede creada con éxito"
          botones={[{ texto: 'Continuar', alPulsar: () => navegar('/sedes') }]}
        />
      )}
    </main>
  );
}

export default CrearSede;
