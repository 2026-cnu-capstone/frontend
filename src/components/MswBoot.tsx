'use client';

import { useEffect, useState } from 'react';
import { initMocks } from '@/mocks/init';

interface Props {
  children: React.ReactNode;
}

const ENABLED = process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true';

export default function MswBoot({ children }: Props) {
  const [ready, setReady] = useState(!ENABLED);

  useEffect(() => {
    if (!ENABLED) return;
    initMocks().finally(() => setReady(true));
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
