export default function LicencaSuspensa() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-warn-soft text-warn text-2xl mb-4">
          !
        </span>
        <h1 className="font-display text-2xl text-ink">Acesso temporariamente indisponível</h1>
        <p className="text-muted text-sm mt-3 leading-relaxed">
          Este ambiente está suspenso no momento. Entre em contato com o responsável pela contratação para mais
          informações.
        </p>
      </div>
    </main>
  );
}
