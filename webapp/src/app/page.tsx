import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">
            Avaliação Integrada de Saúde, Física e Funcional
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-ink text-balance">
            Como você vai acessar hoje?
          </h1>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <Link
            href="/paciente"
            className="group rounded-2xl border border-border bg-surface p-7 transition hover:border-accent hover:shadow-lg hover:shadow-accent/5"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent-dark font-display text-lg">
              P
            </span>
            <h2 className="font-display text-xl text-ink mt-4">Sou paciente</h2>
            <p className="text-muted text-sm mt-2 leading-relaxed">
              Responda o questionário de anamnese antes ou durante a sua avaliação. Leva cerca de
              15-20 minutos e você pode continuar de onde parou.
            </p>
            <span className="inline-block mt-4 text-sm font-medium text-accent group-hover:underline">
              Começar →
            </span>
          </Link>

          <Link
            href="/avaliador/login"
            className="group rounded-2xl border border-border bg-surface p-7 transition hover:border-accent hover:shadow-lg hover:shadow-accent/5"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent-dark font-display text-lg">
              A
            </span>
            <h2 className="font-display text-xl text-ink mt-4">Sou avaliador</h2>
            <p className="text-muted text-sm mt-2 leading-relaxed">
              Acesse a ficha completa dos pacientes e registre a avaliação física, postural e
              funcional.
            </p>
            <span className="inline-block mt-4 text-sm font-medium text-accent group-hover:underline">
              Entrar →
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
