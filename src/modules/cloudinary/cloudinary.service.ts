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

export interface CloudinaryFolder {
  name: string;
  path: string;
}

export interface RenameResult {
  publicId:    string;
  secureUrl:   string;
  displayName: string;
}

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Inserta f_auto,q_auto en la URL de entrega de Cloudinary.
 * Permite que el navegador reciba el formato más compatible
 * (WebP, AVIF, JPEG) aunque el asset original sea HEIC u otro
 * formato no soportado nativamente por los browsers.
 */
function buildDeliveryUrl(secureUrl: string): string {
  return secureUrl.replace('/upload/', '/upload/f_auto,q_auto/');
}

function mapResource(r: Record<string, unknown>): CloudinaryAsset {
  const publicId = r.public_id as string;

  const folder = (r.asset_folder as string) ?? (r.folder as string) ?? '';

  const displayName =
    (r.display_name as string) ??
    (publicId.includes('/')
      ? publicId.substring(publicId.lastIndexOf('/') + 1)
      : publicId);

  return {
    publicId,
    url:       r.url        as string,
    secureUrl: buildDeliveryUrl(r.secure_url as string),
    format:    r.format     as string,
    width:     r.width      as number,
    height:    r.height     as number,
    bytes:     r.bytes      as number,
    createdAt: r.created_at as string,
    folder,
    displayName,
  };
}

// ── Exports ───────────────────────────────────────────────────────────

/**
 * Lista las sub-carpetas inmediatas de un path dado.
 *
 * - path vacío o ausente → carpetas raíz de Cloudinary
 * - path = "coragem"     → sub-carpetas de coragem (ej. products, banners…)
 *
 * Cloudinary devuelve las carpetas hijas en `result.folders`,
 * cada una con { name, path }.
 */
export async function listFolders(path?: string): Promise<CloudinaryFolder[]> {
  const result = path
    ? await cloudinary.api.sub_folders(path)
    : await cloudinary.api.root_folders();

  return (result.folders ?? []).map((f: { name: string; path: string }) => ({
    name: f.name,
    path: f.path,
  }));
}

/**
 * Lista todos los assets de una carpeta específica de Cloudinary.
 *
 * Usa asset_folder en lugar de prefix porque los assets subidos
 * manualmente desde el panel de Cloudinary no incluyen la carpeta
 * en el public_id — la carpeta solo existe en el campo asset_folder.
 *
 * @param folder - Path completo de la carpeta (ej. "coragem/products").
 *                 Si está vacío, lista assets sin carpeta asignada.
 */
export async function listAssets(folder: string): Promise<CloudinaryAsset[]> {
  const result = await cloudinary.api.resources({
    type:          'upload',
    resource_type: 'image',
    asset_folder:  folder,
    max_results:   500,
  });

  return (result.resources ?? []).map(mapResource);
}

/**
 * Actualiza el display_name de un asset en Cloudinary.
 *
 * Se evita 'uploader.rename' porque modifica físicamente el public_id y la URL.
 * 'display_name' solo cambia el nombre visual en el panel, sin afectar
 * el public_id ni la URL de entrega.
 */
export async function renameAsset(
  publicId: string,
  newName:  string,
): Promise<RenameResult> {
  const displayName = newName.trim();

  const result = await cloudinary.uploader.explicit(publicId, {
    type:         'upload',
    display_name: displayName,
  });

  return {
    publicId:    result.public_id,
    secureUrl:   buildDeliveryUrl(result.secure_url),
    displayName,
  };
}