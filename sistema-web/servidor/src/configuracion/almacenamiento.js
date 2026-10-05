import common from "oci-common";
import objectstorage from "oci-objectstorage";

const variablesRequeridas = ["OCI_CONFIG_PROFILE", "OCI_REGION", "OCI_NAMESPACE", "OCI_BUCKET"];

const variablesFaltantes = variablesRequeridas.filter((nombre) => !process.env[nombre]);

if (variablesFaltantes.length > 0) {
  throw new Error(`Faltan variables de entorno para OCI: ${variablesFaltantes.join(", ")}`);
}

const proveedorCredenciales = new common.ConfigFileAuthenticationDetailsProvider(
  undefined,
  process.env.OCI_CONFIG_PROFILE
);

const clienteObjetos = new objectstorage.ObjectStorageClient({
  authenticationDetailsProvider: proveedorCredenciales,
});
clienteObjetos.regionId = process.env.OCI_REGION;

const configuracionBucket = {
  namespace: process.env.OCI_NAMESPACE,
  nombre: process.env.OCI_BUCKET,
  urlBase: `https://objectstorage.${process.env.OCI_REGION}.oraclecloud.com/n/${process.env.OCI_NAMESPACE}/b/${process.env.OCI_BUCKET}/o/`,
};

export { clienteObjetos, configuracionBucket };