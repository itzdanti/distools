export interface ResizeOptions {
  source: string;
  width: number;
  height: number;
  transparent?: boolean;
}

export interface CropOptions {
  source: string;
  width: number;
  height: number;
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
  round?: boolean;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load that image."));
    image.crossOrigin = "anonymous";
    image.src = src;
  });
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

function smooth(state: ImageSmoothingQuality | boolean): ImageSmoothingQuality {
  return typeof state === "boolean"
    ? state
      ? "high"
      : "low"
    : state;
}

/* -------------------------------- resize --------------------------------- */

export async function resizeImage({
  source,
  width,
  height,
  transparent = true,
}: ResizeOptions): Promise<string> {
  const image = await loadImageElement(source);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("This browser blocked the 2D canvas context.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (!transparent) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

/* --------------------------------- crop ---------------------------------- */

export async function cropImage({
  source,
  width,
  height,
  zoom = 1,
  offsetX = 0,
  offsetY = 0,
  round = false,
}: CropOptions): Promise<string> {
  const image = await loadImageElement(source);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("This browser blocked the 2D canvas context.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const scale = Math.max(0.05, zoom);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const drawX = (width - drawWidth) / 2 + offsetX;
  const drawY = (height - drawHeight) / 2 + offsetY;

  ctx.save();
  if (round) {
    const radius = Math.min(width, height) / 2;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    ctx.clip();
  }
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

/* ------------------------------ compression ------------------------------ */

export async function estimateCompressedSize(
  source: string,
  quality = 0.8,
): Promise<{ bytes: number; dataUrl: string }> {
  const image = await loadImageElement(source);
  const canvas = createCanvas(image.naturalWidth, image.naturalHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser blocked the 2D canvas context.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = smooth("high");
  ctx.drawImage(image, 0, 0);
  return { bytes: Math.round((canvas.toDataURL("image/jpeg", quality).length * 3) / 4), dataUrl: canvas.toDataURL("image/jpeg", quality) };
}
