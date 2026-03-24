/**
 * src/lib/cloudinary.ts
 *
 * Configura el cliente de Cloudinary y expone helpers reutilizables
 * para subida y eliminación de imágenes.
 *
 * Se inicializa una sola vez al importar el módulo, usando las
 * variables del config centralizado.
 */

import { v2 as cloudinary } from 'cloudinary';
import { config } from './config';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key:    config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

/**
 * Sube un buffer de imagen a Cloudinary.
 *
 * @param buffer   - Buffer del archivo recibido vía multipart
 * @param folder   - Carpeta destino en Cloudinary (ej. "coragem/products")
 * @param publicId - ID público opcional; si se omite, Cloudinary genera uno
 *
 * @returns url, publicId, width y height del recurso subido
 */
export async function uploadImageBuffer(
  buffer:   Buffer,
  folder:   string,
  publicId?: string,
): Promise<{ url: string; publicId: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: 'image' as const,
      // - Forzar Conversión automatica al subir -
      transformation: [
        { fetch_format: 'auto', quality: 'auto:good' },
      ],
      ...(publicId && { public_id: publicId, overwrite: true }),
    };

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) {
        reject(error ?? new Error('Cloudinary upload failed'));
        return;
      }
      resolve({
        url:      result.secure_url,
        publicId: result.public_id,
        width:    result.width,
        height:   result.height,
      });
    });

    stream.end(buffer);
  });
}

/**
 * Elimina un recurso de Cloudinary por su public_id.
 * No lanza error si el recurso no existe (resultado "not found" se ignora).
 *
 * @param publicId - El public_id devuelto por Cloudinary al subir la imagen
 */
export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

export default cloudinary;