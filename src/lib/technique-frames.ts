/**
 * Extracción de fotogramas en el navegador para el análisis de técnica con IA.
 * Se usa tanto al analizar un archivo ya guardado como justo al subirlo.
 */

const MAX_WIDTH = 640;
export const FRAMES = 5;

function drawToDataUrl(source: HTMLVideoElement | HTMLImageElement, width: number, height: number) {
  const scale = Math.min(1, MAX_WIDTH / width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

export async function framesFromImage(url: string) {
  const img = document.createElement("img");
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("No se ha podido leer la imagen"));
    img.src = url;
  });
  return [drawToDataUrl(img, img.naturalWidth, img.naturalHeight)];
}

export async function framesFromVideo(url: string) {
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;

  await new Promise<void>((resolve, reject) => {
    video.onloadeddata = () => resolve();
    video.onerror = () => reject(new Error("No se ha podido leer el vídeo"));
  });

  const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
  const frames: string[] = [];
  for (let i = 1; i <= FRAMES; i++) {
    const time = (duration * i) / (FRAMES + 1);
    await new Promise<void>((resolve, reject) => {
      video.onseeked = () => resolve();
      video.onerror = () => reject(new Error("No se ha podido leer el vídeo"));
      video.currentTime = Math.min(time, Math.max(0, duration - 0.05));
    });
    frames.push(drawToDataUrl(video, video.videoWidth, video.videoHeight));
  }
  return frames;
}

/** Fotogramas de una URL (archivo ya guardado) según su tipo. */
export async function framesFromUrl(url: string, kind: "video" | "foto") {
  return kind === "video" ? framesFromVideo(url) : framesFromImage(url);
}

/** Fotogramas de un archivo local, sin necesidad de subirlo antes. */
export async function framesFromFile(file: Blob, kind: "video" | "foto") {
  const url = URL.createObjectURL(file);
  try {
    return await framesFromUrl(url, kind);
  } finally {
    URL.revokeObjectURL(url);
  }
}
