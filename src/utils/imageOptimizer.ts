// Helper to strip Exif/ICC (APP1, APP2) from JPEG Blob (Binary Deep Clean)
async function removeJPEGMetadata(blob: Blob): Promise<Blob> {
  const buffer = await blob.arrayBuffer();
  const data = new DataView(buffer);
  const newPieces: BlobPart[] = [];
  let offset = 0;

  if (data.getUint16(0) !== 0xFFD8) return blob; 

  newPieces.push(buffer.slice(0, 2)); // Keep SOI
  offset += 2;

  while (offset < data.byteLength) {
    if (offset + 2 > data.byteLength) break;
    const marker = data.getUint16(offset);
    offset += 2;

    if (marker === 0xFFDA) {
      newPieces.push(buffer.slice(offset - 2)); 
      break; 
    }

    if (offset + 2 > data.byteLength) break;
    const length = data.getUint16(offset);
    
    // NUCLEAR STRATEGY: Strip EVERYTHING that isn't image data.
    const isAppMarker = marker >= 0xFFE0 && marker <= 0xFFEF;
    const isComment = marker === 0xFFFE;

    if (isAppMarker || isComment) {
       // STRIP IT ALL
    } else {
       newPieces.push(buffer.slice(offset - 2, offset + length));
    }

    offset += length;
  }

  return new Blob(newPieces, { type: 'image/jpeg' });
}

// Paranoid Scanner: Whitelist only essential image data. Flag EVERYTHING else.
export async function scanForMetadata(file: File): Promise<string[]> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as ArrayBuffer;
        if (!result) { resolve([]); return; }
        const data = new DataView(result);
        const foundTokens: string[] = [];
        let offset = 0;

        // 1. Check JPEG (FF D8)
        if (data.getUint16(0) === 0xFFD8) {
           offset += 2;
           while (offset < data.byteLength) {
             while (offset < data.byteLength && data.getUint8(offset) === 0xFF) {
               offset++;
             }
             if (offset >= data.byteLength) break;

             const markerType = data.getUint8(offset);
             offset++;

             if (markerType === 0xDA) break; // SOS (Stop parsing)
             if (markerType === 0xD9) break; // EOI

             if (offset + 2 > data.byteLength) break;
             const length = data.getUint16(offset);
             
             // WHITELIST: Only Structural Markers are Allowed
             // SOF0-SOF15 (C0-CF), DHT (C4), DQT (DB), DRI (DD)
             // EVERYTHING ELSE (APPn E0-EF, COM FE) is Metadata.
             const isStructural = 
                (markerType >= 0xC0 && markerType <= 0xCF && markerType !== 0xC4 && markerType !== 0xC8 && markerType !== 0xCC) || // SOF segments
                markerType === 0xC4 || // DHT
                markerType === 0xDB || // DQT
                markerType === 0xDD;   // DRI

             if (!isStructural) {
                 if (markerType >= 0xE0 && markerType <= 0xEF) foundTokens.push(`APP${markerType - 0xE0}`);
                 else if (markerType === 0xFE) foundTokens.push('Comment');
                 else foundTokens.push(`Extra-0x${markerType.toString(16)}`);
             }

             offset += length;
           }
        } 
        // 2. Check PNG (89 50 4E 47 ...)
        else if (data.getUint32(0) === 0x89504E47) {
            offset = 8;
            while (offset < data.byteLength) {
                if (offset + 8 > data.byteLength) break;
                const length = data.getUint32(offset);
                offset += 4;
                
                const type =  String.fromCharCode(
                    data.getUint8(offset),   data.getUint8(offset+1),
                    data.getUint8(offset+2), data.getUint8(offset+3)
                );
                offset += 4;

                // WHITELIST: Only Critical Chunks Allowed (IHDR, PLTE, IDAT, IEND)
                // Any other chunk (pHYs, gAMA, cHRM, tEXt, etc.) is considered 'Data' by paranoid standards.
                const isCritical = ['IHDR', 'PLTE', 'IDAT', 'IEND'].includes(type);
                
                if (!isCritical) {
                    foundTokens.push(type); 
                }

                offset += length + 4; // Skip Data + CRC
            }
        }

        const uniqueTokens = Array.from(new Set(foundTokens));
        resolve(uniqueTokens);
      } catch (err) {
        console.error("Scan error:", err);
        resolve([]);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export async function optimizeImage(file: File): Promise<{ blob: Blob, originalSize: number, optimizedSize: number }> {
    return new Promise((resolve, reject) => {
    const originalSize = file.size;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Initial Max Dimension Constraint
        const MAX_START_DIMENSION = 1600; 
        if (width > MAX_START_DIMENSION || height > MAX_START_DIMENSION) {
                const ratio = Math.min(MAX_START_DIMENSION / width, MAX_START_DIMENSION / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error('Canvas context not supported'));
            return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // TARGET TARGET CALCULATION
        const HARD_LIMIT = 50 * 1024;
        const TARGET_SIZE = originalSize < HARD_LIMIT ? Math.floor(originalSize * 0.95) : HARD_LIMIT;
        
        const MIN_DIMENSION = 800; 

        let quality = 0.9;
        
        const attemptCompression = () => {
            canvas.toBlob(
            async (blob) => {
                if (!blob) {
                    reject(new Error('Compression failed'));
                    return;
                }

                // DEEP CLEAN
                const cleanBlob = await removeJPEGMetadata(blob);

                // SUCCESS CHECK
                if (cleanBlob.size <= TARGET_SIZE) {
                        resolve({ blob: cleanBlob, originalSize, optimizedSize: cleanBlob.size });
                        return;
                }

                if (quality > 0.2) {
                    quality -= 0.1; 
                    attemptCompression();
                    return;
                }

                const canResizeWidth = width * 0.9 >= MIN_DIMENSION;
                const canResizeHeight = height * 0.9 >= MIN_DIMENSION;

                if (canResizeWidth && canResizeHeight) {
                    width = Math.round(width * 0.9);
                    height = Math.round(height * 0.9);
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctxRetry = canvas.getContext('2d');
                    if (ctxRetry) {
                        ctxRetry.fillStyle = '#FFFFFF';
                        ctxRetry.fillRect(0, 0, width, height);
                        ctxRetry.imageSmoothingEnabled = true;
                        ctxRetry.imageSmoothingQuality = 'high';
                        ctxRetry.drawImage(img, 0, 0, width, height);
                        
                        quality = 0.8;
                        attemptCompression();
                    } else {
                        reject(new Error('Canvas context lost'));
                    }
                } else {
                    resolve({ blob: cleanBlob, originalSize, optimizedSize: cleanBlob.size });
                }
            },
            'image/jpeg',
            quality
            );
        };
        
        attemptCompression();
        };
        
        img.onerror = () => reject(new Error('Image load failed'));
    };
    
    reader.onerror = () => reject(new Error('File read failed'));
    });
}

export function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
