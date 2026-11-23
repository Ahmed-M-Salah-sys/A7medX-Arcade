'use client';

import { useEffect, useRef } from 'react';

interface ViewTrackerProps {
  slug: string;
}

export function ViewTracker({ slug }: ViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    // Call view tracking endpoint
    fetch(`/api/games/${slug}/view`, { method: 'POST' }).catch((err) => {
      console.error('Error tracking view:', err);
    });
  }, [slug]);

  return null;
}
