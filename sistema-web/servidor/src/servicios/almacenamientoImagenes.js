import { clienteObjetos, configuracionBucket } from "../configuracion/almacenamiento.js";

export async function subirImagen(buffer, clave, tipoContenido) {
  await clienteObjetos.putObject({
    namespaceName: configuracionBucket.namespace,
    bucketName: configuracionBucket.nombre,
    objectName: clave,
    putObjectBody: buffer,
    contentLength: buffer.length,
    contentType: tipoContenido,
  });
  return clave;
}

export function obtenerUrlImagen(clave) {
  if (!clave) return null;
  return `${configuracionBucket.urlBase}${clave}`;
}


export async function eliminarImagen(clave) {
  if (!clave) return;
  await clienteObjetos.deleteObject({
    namespaceName: configuracionBucket.namespace,
    bucketName: configuracionBucket.nombre,
    objectName: clave
  });
}