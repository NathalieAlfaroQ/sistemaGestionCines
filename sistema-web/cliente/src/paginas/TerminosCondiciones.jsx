const secciones = [
  {
    titulo: '1. Aceptación de los términos',
    texto:
      'Al acceder y utilizar el sitio web de Cine Aurora, usted acepta estos términos y condiciones. Si no está de acuerdo con alguno de ellos, le pedimos no utilizar el sitio.',
  },
  {
    titulo: '2. Uso del sitio',
    texto:
      'El sitio permite consultar la cartelera, conocer las sedes y adquirir productos y entradas. Usted se compromete a utilizarlo de forma lícita y a no realizar acciones que puedan dañar, sobrecargar o interferir con su funcionamiento.',
  },
  {
    titulo: '3. Cuenta de usuario',
    texto:
      'Para algunas funciones es necesario crear una cuenta. Usted es responsable de mantener la confidencialidad de sus credenciales y de toda la actividad realizada con su cuenta. Debe brindar información veraz y mantenerla actualizada.',
  },
  {
    titulo: '4. Compras y pagos',
    texto:
      'Los precios se muestran en colones e incluyen los impuestos aplicables. Una compra se considera confirmada cuando recibe la confirmación correspondiente. Las entradas y los productos están sujetos a disponibilidad.',
  },
  {
    titulo: '5. Cambios y devoluciones',
    texto:
      'Las entradas adquiridas no son reembolsables, salvo que la función sea cancelada o reprogramada por Cine Aurora. En ese caso se ofrecerá el reembolso o el cambio a otra función disponible.',
  },
  {
    titulo: '6. Protección de datos personales',
    texto:
      'Los datos personales que usted proporcione se tratan conforme a la legislación costarricense vigente y se utilizan únicamente para gestionar su cuenta, sus compras y la comunicación con usted. No se compartirán con terceros sin su consentimiento, salvo obligación legal.',
  },
  {
    titulo: '7. Propiedad intelectual',
    texto:
      'Los contenidos del sitio, incluidos textos, logotipos e imágenes, pertenecen a Cine Aurora o a sus respectivos titulares y no pueden reproducirse sin autorización previa.',
  },
  {
    titulo: '8. Limitación de responsabilidad',
    texto:
      'Cine Aurora procura que la información del sitio sea correcta y esté actualizada, pero no garantiza que esté libre de errores ni que el servicio sea ininterrumpido.',
  },
  {
    titulo: '9. Modificaciones',
    texto:
      'Cine Aurora puede modificar estos términos en cualquier momento. Los cambios se publicarán en esta página y entrarán en vigor desde su publicación.',
  },
  {
    titulo: '10. Contacto',
    texto:
      'Si tiene consultas sobre estos términos, puede comunicarse con nosotros por medio de los canales de contacto de cualquiera de nuestras sedes.',
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
