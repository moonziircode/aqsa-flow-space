import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves a stored value (either a storage path or a legacy public URL) into
 * a viewable URL. For private buckets, generates a short-lived signed URL.
 * Returns null while loading or if no value is set.
 */
export function useSignedUrl(bucket: string, value: string | null | undefined, expiresIn = 3600) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    if (!value) return;
    // Legacy: already a full URL — use as-is.
    if (/^https?:\/\//i.test(value)) {
      setUrl(value);
      return;
    }
    supabase.storage
      .from(bucket)
      .createSignedUrl(value, expiresIn)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setUrl(null);
          return;
        }
        setUrl(data.signedUrl);
      });
    return () => {
      cancelled = true;
    };
  }, [bucket, value, expiresIn]);

  return url;
}