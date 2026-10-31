/**
 * Client-side image compression utility.
 * Downscales images to max dimensions and compresses to efficient JPEGs.
 * Converts 3MB-10MB camera/phone photos into lightweight ~40KB-80KB data URLs,
 * preventing browser localStorage quota exhaustion (5MB per origin limit).
 */

export async function compressImage(
  input: File | string,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.72,
): Promise<string> {
  if (typeof window === "undefined") {
    return typeof input === "string" ? input : "";
  }

  // If already a web URL (e.g. Unsplash, CDN), no need to compress
  if (typeof input === "string" && (input.startsWith("http://") || input.startsWith("https://"))) {
    return input;
  }

  // If already a small data URL (< 60KB), return as is
  if (typeof input === "string" && input.startsWith("data:") && input.length < 60000) {
    return input;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        let { width, height } = img;

        // Maintain aspect ratio while bounding within maxWidth & maxHeight
        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(typeof input === "string" ? input : "");
          return;
        }

        // Fill white background for transparent PNGs converted to JPEG
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      } catch (err) {
        // Fallback to original input if canvas conversion fails
        resolve(typeof input === "string" ? input : "");
      }
    };

    img.onerror = () => {
      if (typeof input === "string") {
        resolve(input);
      } else {
        reject(new Error("Unable to read image file."));
      }
    };

    if (typeof input === "string") {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = (e.target?.result as string) || "";
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(input);
    }
  });
}
