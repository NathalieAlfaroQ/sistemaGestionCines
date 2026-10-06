export const TAMANO_MAXIMO_MB = 5;
export const TAMANO_MAXIMO_BYTES = TAMANO_MAXIMO_MB * 1024 * 1024;
export const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

export const TIPOS_IMAGEN = [
{ tipo: 'poster', etiqueta: 'Póster', ayuda: 'Imagen vertical', obligatoria: true, claseAncho: 'w-56', claseProporcion: 'aspect-[2/3]' },
{ tipo: 'banner', etiqueta: 'Banner', ayuda: 'Imagen horizontal', obligatoria: false, claseAncho: 'w-[26rem]', claseProporcion: 'aspect-video' },
];