import { useState, MutableRefObject } from 'react';

export const useCleanup = () => {
  const [clearningLoading, setClearningLoading] = useState<boolean>(false);
  const [imageSource, setImageSource] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const API_URL = 'https://clipdrop-api.co/cleanup/v1';

  const cleanUp = async (
    apiKey : string, 
    imageReferences: MutableRefObject<HTMLImageElement | null>, 
    getMaskImage: (width: number, height: number) => string
  ) => {
    setClearningLoading(true);

    const img = imageReferences.current;
    if (!img) return;

    const originalWidth = img.naturalWidth;
    const originalHeight = img.naturalHeight;
    const originalImage = img.src;
    const maskImage = getMaskImage(originalWidth, originalHeight);
    const originalImageBlob = await (await fetch(originalImage)).blob();
    const maskImageBlob = await (await fetch(maskImage)).blob();
    const originalImageExtension = originalImageBlob.type === "image/jpeg" ? "jpg" : "png";
    const formData = new FormData();
    formData.append(
      "image_file",
      originalImageBlob,
      `image.${originalImageExtension}`
    );
    formData.append("mask_file", maskImageBlob, "mask.png");

    try {
      const headers = {
        'user-agent': 'ClipDrop-BatchProcess',
        'x-api-key': apiKey,
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (response.status && response.status > 400) {
        const text = await response.text();
        throw new Error(response.status + ' ' + text);
      }

      const buffer = await response.arrayBuffer();
      const base64String = btoa(
        new Uint8Array(buffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );
      const dataURL = `data:image/png;base64,${base64String}`;
      setImageSource(dataURL);
      console.log('DEBUG', imageSource);
      setClearningLoading(false);
    } catch (e: any) {
      setError(e);
    } finally {
      setClearningLoading(false);
    }
  };

  return {cleanUp, clearningLoading, imageSource};
};
