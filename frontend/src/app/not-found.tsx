import Link from 'next/link';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <Container className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center text-center">
      <span className="text-8xl font-bold text-brand">404</span>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">
        Página no encontrada
      </h1>
      <p className="mt-2 text-lg text-ink/60">
        La página que buscás no existe o fue movida.
      </p>
      <Link href="/" className="mt-8">
        <Button>Volver al inicio</Button>
      </Link>
    </Container>
  );
}
