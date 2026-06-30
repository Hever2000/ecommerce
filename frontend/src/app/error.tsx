'use client';

import { useEffect } from 'react';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center text-center">
      <span className="text-8xl font-bold text-brand">!</span>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">
        Algo salió mal
      </h1>
      <p className="mt-2 text-lg text-ink/60">
        Ocurrió un error inesperado. Intentá de nuevo.
      </p>
      <Button onClick={reset} className="mt-8">
        Volver al inicio
      </Button>
    </Container>
  );
}
