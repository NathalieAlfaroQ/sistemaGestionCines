import { Button } from 'flowbite-react';

function AccionesFila({ fila, alVer, alEditar, alBorrar }) {
  const acciones = [
    { texto: 'Ver', manejador: alVer },
    { texto: 'Editar', manejador: alEditar },
    { texto: 'Borrar', manejador: alBorrar },
  ];

  return (
    <div className="flex justify-center gap-3">
      {acciones.map(({ texto, manejador }) => (
        <Button
          key={texto}
          size="xs"
          color="acento"
          disabled={!manejador}
          onClick={() => manejador(fila)}
        >
          {texto}
        </Button>
      ))}
    </div>
  );
}

export default AccionesFila;