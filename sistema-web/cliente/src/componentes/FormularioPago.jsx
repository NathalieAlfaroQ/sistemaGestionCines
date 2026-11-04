import { useState } from 'react';
import { Checkbox, Label, Radio, TextInput } from 'flowbite-react';
import { IconoVer } from '../common/iconos.jsx';
import { LARGOS_TARJETA } from '../validaciones/validacionesTarjeta.js';
import Campo from './Campo.jsx';

// Ancho de los campos de la tarjeta: el largo máximo (ver LARGOS_TARJETA) + 4 caracteres de relleno
// interno; el CVV solo + 2. max-w-full los encoge en pantallas angostas.
// Las clases van escritas completas para que Tailwind las detecte.
const ANCHOS = {
  titular: 'w-[30ch] max-w-full', // 26
  numero: 'w-[27ch] max-w-full', // 23 (19 dígitos + 4 espacios)
  vencimiento: 'w-[9ch] max-w-full', // 5 (MM/AA)
  cvv: 'w-[6ch] max-w-full', // 4
};

// Los datos personales no se editan: cada campo mide lo que muestra + 4 de relleno.
// Va como estilo en línea porque el ancho depende del valor (Tailwind no genera clases dinámicas).
const RELLENO_CARACTERES = 4;
const MINIMO_CARACTERES = 6;

function anchoSegunContenido(texto) {
  const caracteres = Math.max(texto.length, MINIMO_CARACTERES) + RELLENO_CARACTERES;
  return { width: `${caracteres}ch`, maxWidth: '100%' };
}

function CampoSoloLectura({ id, etiqueta, valor, type = 'text' }) {
  return (
    <Campo id={id} etiqueta={etiqueta}>
      <TextInput id={id} type={type} value={valor} readOnly style={anchoSegunContenido(valor)} />
    </Campo>
  );
}

export const METODOS = {
  tarjetaGuardada: 'tarjetaGuardada',
  tarjetaNueva: 'tarjetaNueva',
  paypal: 'paypal',
};

function IconoOcultar({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.8 9.8 0 0112 5c5 0 9 4.5 10 7a12.6 12.6 0 01-3.2 4.3M6.1 6.1A12.7 12.7 0 002 12c1 2.5 5 7 10 7a9.6 9.6 0 004.4-1" />
    </svg>
  );
}

// Campo de texto con botón para mostrar u ocultar el valor (número de tarjeta y CVV).
// El botón va al lado del campo y no encima, para no tapar los dígitos en campos angostos.
function CampoOculto({ id, etiqueta, ancho, propiedades, error, ...resto }) {
  const [visible, setVisible] = useState(false);

  return (
    <Campo id={id} etiqueta={etiqueta} obligatorio error={error}>
      <div className="flex items-center gap-1">
        <TextInput
          id={id}
          type={visible ? 'text' : 'password'}
          inputMode="numeric"
          className={ancho}
          {...propiedades}
          {...resto}
        />
        <button
          type="button"
          onClick={() => setVisible((anterior) => !anterior)}
          aria-label={visible ? `Ocultar ${etiqueta.toLowerCase()}` : `Mostrar ${etiqueta.toLowerCase()}`}
          className="flex items-center p-2 text-text-muted hover:text-text-color"
        >
          {visible ? <IconoOcultar /> : <IconoVer />}
        </button>
      </div>
    </Campo>
  );
}

function OpcionMetodo({ valor, metodo, setMetodo, deshabilitado = false, children }) {
  const id = `metodo-${valor}`;
  return (
    <div className="flex items-center gap-3">
      <Radio
        id={id}
        name="metodo-pago"
        value={valor}
        checked={metodo === valor}
        onChange={() => setMetodo(valor)}
        disabled={deshabilitado}
        className="text-brand-soft focus:ring-brand-soft"
      />
      <Label htmlFor={id} className={deshabilitado ? 'opacity-50' : ''}>
        {children}
      </Label>
    </div>
  );
}

// Columna derecha de la pantalla de pago: datos del cliente (solo lectura) y método de pago.
// Los datos personales son solo para mostrar: el servidor toma el correo del token, no de aquí.
function FormularioPago({ id, usuario, metodoGuardado, metodo, setMetodo, tarjeta, deshabilitado, alEnviar }) {
  return (
    <form id={id} noValidate onSubmit={alEnviar} className="flex min-w-0 flex-col gap-8 text-text-color">
      <fieldset disabled={deshabilitado} className="flex min-w-0 flex-col gap-4">
        <legend className="mb-4 text-sm">Datos personales</legend>
        <CampoSoloLectura id="nombre" etiqueta="Nombre" valor={usuario?.nombre ?? ''} />
        <CampoSoloLectura id="apellido" etiqueta="Apellido" valor={usuario?.apellido ?? ''} />
        <CampoSoloLectura id="correo" etiqueta="Correo" type="email" valor={usuario?.correo ?? ''} />
      </fieldset>

      <fieldset disabled={deshabilitado} className="flex min-w-0 flex-col gap-3">
        <legend className="mb-4 text-sm">Método de pago</legend>

        <OpcionMetodo valor={METODOS.paypal} metodo={metodo} setMetodo={setMetodo}>
          PayPal
        </OpcionMetodo>

        {metodoGuardado && (
          <OpcionMetodo
            valor={METODOS.tarjetaGuardada}
            metodo={metodo}
            setMetodo={setMetodo}
            deshabilitado={metodoGuardado.vencida}
          >
            {metodoGuardado.marca} •••• {metodoGuardado.ultimosDigitos}{' '}
            <span className="text-xs">
              {metodoGuardado.vencida ? '(vencida)' : `(vence ${metodoGuardado.vencimiento})`}
            </span>
          </OpcionMetodo>
        )}

        <OpcionMetodo valor={METODOS.tarjetaNueva} metodo={metodo} setMetodo={setMetodo}>
          Tarjeta de crédito o débito
        </OpcionMetodo>
      </fieldset>

      {metodo === METODOS.tarjetaNueva && (
        <fieldset disabled={deshabilitado} className="flex min-w-0 flex-col gap-4">
          <legend className="sr-only">Datos de la tarjeta</legend>

          <Campo id="titular" etiqueta="Nombre en la tarjeta" obligatorio error={tarjeta.errorVisible('titular')}>
            <TextInput
              id="titular"
              className={ANCHOS.titular}
              autoComplete="cc-name"
              maxLength={LARGOS_TARJETA.titular}
              {...tarjeta.enlazar('titular')}
            />
          </Campo>

          <CampoOculto
            id="numero"
            etiqueta="Número de tarjeta"
            ancho={ANCHOS.numero}
            autoComplete="cc-number"
            maxLength={LARGOS_TARJETA.numero}
            propiedades={tarjeta.enlazar('numero')}
            error={tarjeta.errorVisible('numero')}
          />

          <div className="flex flex-wrap gap-6">
            <Campo id="vencimiento" etiqueta="Vencimiento" obligatorio error={tarjeta.errorVisible('vencimiento')}>
              <TextInput
                id="vencimiento"
                className={ANCHOS.vencimiento}
                placeholder="MM/AA"
                inputMode="numeric"
                autoComplete="cc-exp"
                maxLength={LARGOS_TARJETA.vencimiento}
                {...tarjeta.enlazar('vencimiento')}
              />
            </Campo>
            <CampoOculto
              id="cvv"
              etiqueta="CVV"
              ancho={ANCHOS.cvv}
              autoComplete="cc-csc"
              maxLength={LARGOS_TARJETA.cvv}
              propiedades={tarjeta.enlazar('cvv')}
              error={tarjeta.errorVisible('cvv')}
            />
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="guardar-tarjeta"
              checked={tarjeta.guardarTarjeta}
              onChange={(evento) => tarjeta.setGuardarTarjeta(evento.target.checked)}
              className="text-brand-soft focus:ring-brand-soft"
            />
            <Label htmlFor="guardar-tarjeta">
              ¿Deseas guardar este método de pago para tus próximas compras?
            </Label>
          </div>
        </fieldset>
      )}
    </form>
  );
}

export default FormularioPago;
