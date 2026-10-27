const secciones = [
  {
    titulo: 'Lorem ipsum',
    texto:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras vitae tincidunt tortor. In eget vestibulum arcu, egestas sollicitudin turpis.',
  },
];

function TerminosCondiciones() {
  return (
    <main className="mx-auto w-full max-w-3xl px-8 py-10 text-text-color lg:px-16">
      <h1 className="text-2xl font-semibold">Términos y condiciones</h1>
      <p className="mt-2 text-sm text-text-muted">Última actualización: octubre de 2026</p>

      {secciones.map((seccion) => (
        <section key={seccion.titulo} className="mt-8">
          <h2 className="text-lg font-semibold">{seccion.titulo}</h2>
          <p className="mt-2 leading-relaxed text-text-color/80">{seccion.texto}</p>
        </section>
      ))}
    </main>
  );
}

export default TerminosCondiciones;
