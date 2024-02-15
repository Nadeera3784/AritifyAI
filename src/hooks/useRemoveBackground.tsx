import { useState } from 'react';

export const useRemoveBackground = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [dataURL, setDataURl] = useState<string | null>(null);

  const API_URL = 'https://clipdrop-api.co/remove-background/v1';

  const removeBackground = async (file: File, apiKey: string) => {
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('image_file', file);

      const headers: Record<string, string> = {
        'user-agent': 'ClipDrop-BatchProcess',
        'x-api-key': apiKey,
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: form,
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
      setDataURl(`data:image/png;base64,${base64String}`);
      setLoading(false);
    } catch (error: any) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  return { removeBackground, loading, error, dataURL };
};
