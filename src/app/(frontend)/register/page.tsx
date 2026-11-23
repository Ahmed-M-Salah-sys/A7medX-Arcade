'use client';

import { Suspense } from 'react';
import { AuthContent } from '../login/page';

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthContent forcedTab="register" />
    </Suspense>
  );
}
