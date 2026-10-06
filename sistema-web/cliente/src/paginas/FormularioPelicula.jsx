import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ThemeProvider } from 'flowbite-react';
import { useCatalogo } from '../ganchos/useCatalogo.js';
import { useFormularioPelicula } from '../ganchos/useFormularioPelicula.js';
import { useVolver } from '../ganchos/useVolver.js';
import { crearPelicula, subirImagenesPelicula } from '../servicios/servicioPeliculas.js';
import { TIPOS_IMAGEN } from '../constantes/imagenesPelicula.js';
import { clasesFormulario, temaFormulario } from '../temas/temaFormulario.js';
import CamposPelicula from '../componentes/CamposPelicula.jsx';

const MENSAJE_EXITO = 'Película creada con éxito';
const MENSAJE_ERROR = 'Error al crear la película, intente después';
const TIEMPO_MENSAJE_MS = 1500;

function FormularioPelicula() {
  const navegar = useNavigate();
  const volver = useVolver('/peliculas');
  const { catalogo, cargando: cargandoCatalogo, error: errorCatalogo } = useCatalogo();
  const datos = useFormularioPelicula();

  const [idCreada, setIdCreada] = useState(null);
  const [subidas, setSubidas] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState(null);

  const bloqueado = idCreada !== null;

  // Tras el mensaje de éxito, vuelve a la lista
  useEffect(() => {
    if (!exito) return undefined;

    const temporizador = setTimeout(() => void navegar('/peliculas'), TIEMPO_MENSAJE_MS);
    return () => clearTimeout(temporizador);
  }, [exito, navegar]);

  function alCancelar() {
    datos.limpiar();
    setIdCreada(null);
    setSubidas([]);
    setError(null);
    volver();
  }

  async function alEnviar(evento) {
    evento.preventDefault();

    // No se deja crear mientras haya algún campo vacío o con formato inválido
    if (!datos.validarAlEnviar()) return;

    setGuardando(true);
    setError(null);

    try {
      let idPelicula = idCreada;

      if (idPelicula === null) {
        const creada = await crearPelicula(datos.formulario);
        idPelicula = creada.idPelicula;
        setIdCreada(idPelicula);
      }

      const pendientes = {};
      for (const { tipo } of TIPOS_IMAGEN) {
        if (datos.imagenes[tipo] && !subidas.includes(tipo)) {
          pendientes[tipo] = datos.imagenes[tipo];
        }
      }

      const resultado = await subirImagenesPelicula(idPelicula, pendientes);
      setSubidas([...subidas, ...resultado.subidas]);
      datos.establecerErroresImagen(resultado.fallos);

      if (Object.keys(resultado.fallos).length === 0) {
        setExito(true);
      }
    } catch (error_) {
      console.error('Error al crear la película:', error_);
      setError(MENSAJE_ERROR);
    } finally {
      setGuardando(false);
    }
  }

  if (cargandoCatalogo) {
    return <p className="p-8 text-white">Cargando formulario...</p>;
  }

  if (errorCatalogo) {
    return <p className={`p-8 ${clasesFormulario.error}`}>{errorCatalogo}</p>;
  }

  let textoBoton = 'Crear';
  if (guardando) textoBoton = 'Creando...';
  else if (bloqueado) textoBoton = 'Reintentar subida';

  return (
    <ThemeProvider theme={temaFormulario}>
      <main className={`min-h-[calc(100vh-6rem)] ${clasesFormulario.pagina}`}>
        <div className="max-w-screen-2xl mx-auto px-8 py-8">
          <h1 className="mb-8 text-3xl font-bold">Crear película</h1>

          <form
            noValidate
            onSubmit={alEnviar}
            className="grid gap-x-12 gap-y-8 lg:grid-cols-2 lg:items-start"
          >
            <CamposPelicula datos={datos} catalogo={catalogo} subidas={subidas} bloqueado={bloqueado} />

            <div className="lg:col-span-2">
              {error && <p role="alert" className={`mb-4 ${clasesFormulario.error}`}>{error}</p>}
              {exito && <output className={`mb-4 block ${clasesFormulario.exito}`}>{MENSAJE_EXITO}</output>}
              {bloqueado && !exito && (
                <p className={`mb-4 ${clasesFormulario.aviso}`}>
                  La película ya se creó, pero alguna imagen no se pudo subir. Elija otra imagen
                  y presione &quot;Reintentar subida&quot;, o vuelva a la lista para dejarla sin ella.
                </p>
              )}
              <p className={`mb-4 text-sm ${clasesFormulario.acento}`}>* Espacio obligatorio</p>

              <div className="flex gap-4">
                <Button type="submit" color="brand" disabled={guardando || exito}>
                  {textoBoton}
                </Button>

                <Button type="button" color="brand" disabled={guardando || exito} onClick={alCancelar}>
                  {bloqueado ? 'Volver a la lista' : 'Cancelar'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </ThemeProvider>
  );
}

export default FormularioPelicula;