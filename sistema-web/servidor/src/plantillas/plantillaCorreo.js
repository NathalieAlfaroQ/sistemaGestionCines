// Plantilla base de los correos de Cine Aurora.
//
// Basada en "Free Responsive HTML Email Template" de Lee Munroe (versión con estilos en línea,
// email-inlined.html): https://github.com/leemunroe/responsive-html-email-template
//
//   The MIT License (MIT) - Copyright (c) [2013] [Lee Munroe]
//   Permission is hereby granted, free of charge, to any person obtaining a copy of this software
//   and associated documentation files (the "Software"), to deal in the Software without
//   restriction, including without limitation the rights to use, copy, modify, merge, publish,
//   distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
//   Software is furnished to do so, subject to the following conditions:
//   The above copyright notice and this permission notice shall be included in all copies or
//   substantial portions of the Software.
//   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.
//
// Cambios respecto a la original:
//   - Se agregó una franja de encabezado con el nombre del cine y el color de la marca.
//   - El contenido y el pie se reciben por parámetro en vez de ser texto fijo.
//   - Se quitaron el botón de llamada a la acción, el enlace para darse de baja y el
//     "Powered by" (los correos del cine son transaccionales, no de marketing).
//   - Los estilos que se repiten en cada etiqueta quedaron en constantes.

export const COLOR_MARCA = '#3D1D53';
const FUENTE = 'Helvetica, sans-serif';

// Estilos de la plantilla original, copiados de email-inlined.html
export const ESTILO_TABLA = 'border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;';
export const ESTILO_CELDA = `font-family: ${FUENTE}; font-size: 16px; vertical-align: top;`;
export const ESTILO_PARRAFO = `font-family: ${FUENTE}; font-size: 16px; font-weight: normal; margin: 0; margin-bottom: 16px;`;
const ESTILO_PIE = `font-family: ${FUENTE}; vertical-align: top; color: #9a9ea6; font-size: 14px; text-align: center;`;

// Estas reglas no se pueden poner en línea (media queries y arreglos para Outlook y Apple Mail),
// por eso la plantilla original las deja en el <head>. Se copian tal cual.
const ESTILOS_HEAD = `
@media only screen and (max-width: 640px) {
  .main p, .main td, .main span { font-size: 16px !important; }
  .wrapper { padding: 8px !important; }
  .content { padding: 0 !important; }
  .container { padding: 0 !important; padding-top: 8px !important; width: 100% !important; }
  .main { border-left-width: 0 !important; border-radius: 0 !important; border-right-width: 0 !important; }
}
@media all {
  .ExternalClass { width: 100%; }
  .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
  .apple-link a { color: inherit !important; font-family: inherit !important; font-size: inherit !important; font-weight: inherit !important; line-height: inherit !important; text-decoration: none !important; }
  #MessageViewBody a { color: inherit; text-decoration: none; font-size: inherit; font-family: inherit; font-weight: inherit; line-height: inherit; }
}`;

// titulo: <title> del documento. preencabezado: texto que algunos clientes muestran como vista
// previa en la bandeja. contenido y pie: HTML ya escapado por quien llama.
export function plantillaCorreo({ titulo, preencabezado, contenido, pie }) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>${titulo}</title>
    <style media="all" type="text/css">${ESTILOS_HEAD}
    </style>
  </head>
  <body style="font-family: ${FUENTE}; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.3; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; background-color: #f4f5f6; margin: 0; padding: 0;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body" style="${ESTILO_TABLA} background-color: #f4f5f6;" width="100%" bgcolor="#f4f5f6">
      <tr>
        <td style="${ESTILO_CELDA}" valign="top">&nbsp;</td>
        <td class="container" style="${ESTILO_CELDA} max-width: 600px; padding: 0; padding-top: 24px; width: 600px; margin: 0 auto;" width="600" valign="top">
          <div class="content" style="box-sizing: border-box; display: block; margin: 0 auto; max-width: 600px; padding: 0;">

            <!-- INICIO DEL CONTENEDOR BLANCO CENTRADO -->
            <span class="preheader" style="color: transparent; display: none; height: 0; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; visibility: hidden; width: 0;">${preencabezado}</span>
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="main" style="${ESTILO_TABLA} background: #ffffff; border: 1px solid #eaebed; border-radius: 16px; overflow: hidden;" width="100%">

              <!-- ENCABEZADO (agregado: no está en la plantilla original) -->
              <tr>
                <td style="${ESTILO_CELDA} background-color: ${COLOR_MARCA}; color: #ffffff; padding: 20px 24px; text-align: center; font-size: 22px; font-weight: bold; letter-spacing: 2px;" bgcolor="${COLOR_MARCA}" align="center" valign="top">CINE AURORA</td>
              </tr>

              <!-- CONTENIDO PRINCIPAL -->
              <tr>
                <td class="wrapper" style="${ESTILO_CELDA} box-sizing: border-box; padding: 24px;" valign="top">
                  ${contenido}
                </td>
              </tr>
            </table>

            <!-- PIE -->
            <div class="footer" style="clear: both; padding-top: 24px; text-align: center; width: 100%;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="${ESTILO_TABLA}" width="100%">
                <tr>
                  <td class="content-block" style="${ESTILO_PIE}" valign="top" align="center">
                    <span class="apple-link">${pie}</span>
                  </td>
                </tr>
              </table>
            </div>

          <!-- FIN DEL CONTENEDOR BLANCO CENTRADO --></div>
        </td>
        <td style="${ESTILO_CELDA}" valign="top">&nbsp;</td>
      </tr>
    </table>
  </body>
</html>`;
}