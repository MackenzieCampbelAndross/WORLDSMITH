"use client";

import { useEffect, useState } from "react";
import { getSignedUrls } from "@/lib/portal";

export function useSignedUrls(paths: Array<string | null | undefined>): Record<string, string> {
  const key = paths.filter(Boolean).join("|");
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!key) return;
    let active = true;
    void getSignedUrls(key.split("|"))
      .then((next) => {
        if (active) setUrls(next);
      })
      .catch(() => {
        if (active) setUrls({});
      });
    return () => {
      active = false;
    };
  }, [key]);

  return urls;
}
