import cloudinary from '../../lib/cloudinary';

export interface CloudinaryAsset {
  publicId:    string;
  url:         string;
  secureUrl:   string;
  format:      string;
  width:       number;
  height:      number;
  bytes:       number;
  createdAt:   string;
  folder:      string;
  displayName: string;
}

export interface RenameResult {
  publicId:  string;
  secureUrl: string;
}

const ASSET_FOLDER = 'coragem/products';

/**
 * Lista todos los assets de la carpeta de productos en Cloudinary.
 *
 * Usa asset_folder en lugar de prefix porque los assets subidos
 * manualmente desde el panel de Cloudinary no incluyen la carpeta
 * en el public_id — la carpeta solo existe en el campo asset_folder.
 */
export async function listAssets(): Promise<CloudinaryAsset[]> {
  const result = await cloudinary.api.resources({
    type:          'upload',
    resource_type: 'image',
    asset_folder:  ASSET_FOLDER,  // ← reemplaza prefix
    max_results:   500,
  });

  return (result.resources ?? []).map(mapResource);
}

/**
 * Renombra un asset en Cloudinary.
 */
export async function renameAsset(
  fromPublicId: string,
  newName:      string,
): Promise<RenameResult> {
  const sanitized  = sanitizeName(newName);

  // Si el public_id original no tiene carpeta, el destino tampoco la lleva
  const folder     = fromPublicId.includes('/')
    ? fromPublicId.substring(0, fromPublicId.lastIndexOf('/') + 1)
    : '';

  const toPublicId = folder ? `${folder}${sanitized}` : sanitized;

  const result = await cloudinary.uploader.rename(fromPublicId, toPublicId, {
    overwrite: false,
  });

  return {
    publicId:  result.public_id,
    secureUrl: buildDeliveryUrl(result.secure_url),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Inserta f_auto,q_auto en la URL de entrega de Cloudinary.
 * Esto permite que el navegador reciba el formato más compatible
 * (WebP, AVIF, JPEG) aunque el asset original sea HEIC u otro
 * formato no soportado nativamente por los browsers.
 */
function buildDeliveryUrl(secureUrl: string): string {
  return secureUrl.replace('/upload/', '/upload/f_auto,q_auto/');
}

function mapResource(r: Record<string, unknown>): CloudinaryAsset {
  const publicId = r.public_id as string;

  // asset_folder es la carpeta real del panel de Cloudinary
  const folder = (r.asset_folder as string) ?? (r.folder as string) ?? '';

  // display_name viene del panel; si no existe usamos la última parte del public_id
  const displayName = (r.display_name as string)
    ?? (publicId.includes('/')
      ? publicId.substring(publicId.lastIndexOf('/') + 1)
      : publicId);

  return {
    publicId,
    url:         r.url        as string,
    secureUrl:   buildDeliveryUrl(r.secure_url as string),
    format:      r.format     as string,
    width:       r.width      as number,
    height:      r.height     as number,
    bytes:       r.bytes      as number,
    createdAt:   r.created_at as string,
    folder,
    displayName,
  };
}

/** Normaliza el nombre: trim, espacios a guiones, solo caracteres seguros. */
function sanitizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_\-]/g, '');
}