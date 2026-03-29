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

export interface MoveResult {
  moved:  number;
  assets: CloudinaryAsset[];
}

// ── Helpers ───────────────────────────────────────────────────────────

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

export async function listFolders(path?: string): Promise<CloudinaryFolder[]> {
  const result = path
    ? await cloudinary.api.sub_folders(path)
    : await cloudinary.api.root_folders();

  return (result.folders ?? []).map((f: { name: string; path: string }) => ({
    name: f.name,
    path: f.path,
  }));
}

export async function listAssets(folder: string): Promise<CloudinaryAsset[]> {
  const result = await cloudinary.api.resources({
    type:          'upload',
    resource_type: 'image',
    asset_folder:  folder,
    max_results:   500,
  });

  return (result.resources ?? [])
    .filter((r: Record<string, unknown>) => {
      const assetFolder = (r.asset_folder as string) ?? (r.folder as string) ?? '';
      return assetFolder === folder;
    })
    .map(mapResource);
}

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

/**
 * Mueve uno o varios assets a una carpeta destino en Cloudinary.
 *
 * Estrategia: usa `uploader.explicit` con `asset_folder` para cambiar
 * la carpeta lógica del asset sin modificar su public_id ni su URL.
 *
 * Por qué NO usar `uploader.rename`:
 *   En esta cuenta, `asset_folder` y el prefijo del `public_id` son
 *   campos independientes. `rename` modifica el `public_id` (URL física)
 *   pero no actualiza `asset_folder`, y además falla cuando el filename
 *   resultante ya existe en el destino. `explicit` con `asset_folder`
 *   es la API correcta para mover assets entre carpetas lógicas.
 *
 * @param publicIds    - Lista de public_ids a mover
 * @param targetFolder - Carpeta destino (ej. "coragem/banners").
 *                       Cadena vacía = carpeta raíz.
 */
export async function moveAssets(
  publicIds:    string[],
  targetFolder: string,
): Promise<MoveResult> {
  const results = await Promise.allSettled(
    publicIds.map(async (publicId) => {
      const result = await cloudinary.uploader.explicit(publicId, {
        type:         'upload',
        asset_folder: targetFolder,
      });

      return mapResource(result as unknown as Record<string, unknown>);
    }),
  );

  const moved: CloudinaryAsset[] = [];
  const errors: string[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      moved.push(result.value);
    } else {
      errors.push((result.reason as Error).message ?? 'Error desconocido');
    }
  }

  if (moved.length === 0) {
    throw new Error(errors[0] || 'No se movió ningún asset');
  }

  return { moved: moved.length, assets: moved };
}