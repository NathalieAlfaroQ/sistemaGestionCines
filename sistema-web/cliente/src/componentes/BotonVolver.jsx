import { Button, ThemeProvider } from 'flowbite-react';
import { temaFormulario } from '../temas/temaFormulario.js';

function BotonVolver({ alVolver }) {
  return (
    <ThemeProvider theme={temaFormulario}>
      <Button type="button" color="brand" onClick={alVolver}>
        Volver
        <svg
          className="ml-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </Button>
    </ThemeProvider>
  );
}

export default BotonVolver;