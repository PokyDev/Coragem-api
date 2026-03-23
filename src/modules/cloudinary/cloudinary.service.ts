/**
 * src/modules/cloudinary/cloudinary.service.ts
 *
 * Interactúa con la Admin API de Cloudinary para listar assets
 * y renombrar public_ids.
 *
 * Usa la instancia ya configurada en src/lib/cloudinary.ts.
 * La carpeta base es configurable — por defecto "coragem/products".
 */

import { v2 as cloudinary } from 'cloudinary';

export interface CloudinaryAsset {
  publicId:   string;
  url:        string;
  secureUrl:  string;
  format:     string;
  width:      number;
  height:     number;
  bytes:      number;
  createdAt:  string;
  folder:     string;
  displayName: string; // nombre legible sin la ruta de carpeta
}

export interface RenameResult {
  publicId:  string;
  secureUrl: string;
}

const FOLDER = 'coragem/products';

/**
 * Lista todos los assets de la carpeta de productos en Cloudinary.
 * Usa paginación interna para devolver hasta 500 recursos.
 */
export async function listAssets(): Promise<CloudinaryAsset[]> {
  const result = await cloudinary.api.resources({
    type:        'upload',
    prefix:      FOLDER,
    max_results: 500,
    resource_type: 'image',
  });

  return (result.resources ?? []).map(mapResource);
}

/**
 * Renombra un asset en Cloudinary.
 * fromPublicId y toPublicId son los public_ids completos (con carpeta).
 * Si toPublicId no incluye la carpeta base, se la adjuntamos.
 */
export async function renameAsset(
  fromPublicId: string,
  newName:      string,
): Promise<RenameResult> {
  // Extraer la carpeta del public_id original y construir el destino
  const folder   = fromPublicId.substring(0, fromPublicId.lastIndexOf('/') + 1);
  const toPublicId = `${folder}${sanitizeName(newName)}`;

  const result = await cloudinary.uploader.rename(fromPublicId, toPublicId, {
    overwrite: false,
  });

  return {
    publicId:  result.public_id,
    secureUrl: result.secure_url,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────

function mapResource(r: Record<string, unknown>): CloudinaryAsset {
  const publicId = r.public_id as string;
  const folder   = r.folder as string ?? '';

  // El nombre para mostrar es la última parte del public_id (sin carpeta)
  const rawName    = publicId.includes('/')
    ? publicId.substring(publicId.lastIndexOf('/') + 1)
    : publicId;

  return {
    publicId,
    url:         r.url         as string,
    secureUrl:   r.secure_url  as string,
    format:      r.format      as string,
    width:       r.width       as number,
    height:      r.height      as number,
    bytes:       r.bytes       as number,
    createdAt:   r.created_at  as string,
    folder,
    displayName: rawName,
  };
}

/** Normaliza el nombre: trim, reemplaza espacios por guiones, minúsculas. */
function sanitizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_\-]/g, '');
}