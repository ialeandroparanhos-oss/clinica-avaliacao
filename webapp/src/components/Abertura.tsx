"use client";

// Tela de abertura da página inicial: logo, uma frase de apresentação e os três passos da avaliação.
// Aparece uma vez por sessão do navegador (ao voltar à página inicial na mesma sessão, vai direto à escolha).

import { useEffect, useState } from "react";
import { NOME_PROFISSIONAL } from "@/lib/marca";
import { AvatarEvolucao } from "./AvatarEvolucao";

const CHAVE = "abertura_vista";

const PASSOS = [
  { n: "1", titulo: "Conte a sua história", texto: "Um questionário sobre saúde, dores, rotina e objetivos." },
  { n: "2", titulo: "Avaliação presencial", texto: "Medidas, postura, testes de força, equilíbrio e condicionamento." },
  { n: "3", titulo: "Seu plano de cuidado", texto: "Resultados em linguagem simples e um caminho para os próximos meses." },
];

export function Abertura() {
  const [estado, setEstado] = useState<"aberta" | "saindo" | "fechada">("aberta");

  useEffect(() => {
    try {
      if (sessionStorage.getItem(CHAVE) === "1") setEstado("fechada");
    } catch {}
  }, []);

  function comecar() {
    try {
      sessionStorage.setItem(CHAVE, "1");
    } catch {}
    setEstado("saindo");
    setTimeout(() => setEstado("fechada"), 450);
  }

  if (estado === "fechada") return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Apresentação da Avaliação Integrada"
      className={`fixed inset-0 z-50 overflow-y-auto bg-accent-dark text-white transition-opacity duration-500 ${estado === "saindo" ? "opacity-0" : "opacity-100"}`}
    >
      <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center px-5 py-8 text-center sm:px-6 sm:py-12">
        <div className="abertura-entra rounded-3xl bg-white px-6 py-3 shadow-xl sm:px-8 sm:py-5" style={{ animationDelay: "0ms" }}>
          <img src="/logo-sceh.png" alt="Logo" className="h-14 w-auto sm:h-24" />
        </div>

        <div className="abertura-entra mt-5 h-px w-24 bg-gold sm:mt-8" style={{ animationDelay: "150ms" }} />

        <p className="abertura-entra mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-gold sm:mt-6" style={{ animationDelay: "250ms" }}>
          Avaliação Integrada
        </p>
        <h1 className="abertura-entra mt-3 font-display text-[1.7rem] leading-tight text-white text-balance sm:text-5xl" style={{ animationDelay: "350ms" }}>
          Saúde, física e funcional, em um só cuidado
        </h1>
        <p className="abertura-entra mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:mt-4 sm:text-lg" style={{ animationDelay: "450ms" }}>
          Entender como você está hoje para montar, junto com você, um plano feito para a sua rotina e os seus objetivos.
        </p>

        <AvatarEvolucao />

        <ol className="mt-5 grid w-full gap-2 text-left sm:mt-10 sm:grid-cols-3 sm:gap-3">
          {PASSOS.map((p, i) => (
            <li
              key={p.n}
              className="abertura-entra flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 sm:block sm:p-5"
              style={{ animationDelay: `${900 + i * 120}ms` }}
            >
              <span className="w-6 shrink-0 text-center font-display text-2xl text-gold sm:w-auto sm:text-left">{p.n}</span>
              <div>
                <p className="text-sm font-semibold text-white sm:mt-1">{p.titulo}</p>
                <p className="mt-1 hidden text-sm leading-snug text-white/70 sm:block">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={comecar}
          className="abertura-entra mt-7 rounded-full bg-gold px-10 py-3 text-base font-semibold text-accent-dark shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          style={{ animationDelay: "1300ms" }}
        >
          Começar
        </button>

        <p className="abertura-entra mt-5 text-xs text-white/60 sm:mt-8" style={{ animationDelay: "1400ms" }}>
          {NOME_PROFISSIONAL} · Doutorado em Ciências da Saúde
        </p>
      </div>
    </div>
  );
}
