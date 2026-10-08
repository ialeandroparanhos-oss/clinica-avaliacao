// Agente 4 — Paula: registro da posição das escápulas na foto POSTERIOR por marcação manual.
//
// O modelo de pose da foto não enxerga as escápulas, então o avaliador clica nos pontos (de
// preferência sobre marcadores adesivos colocados na pele antes da foto). O sistema mede a
// posição de repouso e a diferença entre os lados, para REGISTRAR e COMPARAR entre avaliações.
//
// LIMITE IMPORTANTE (D'hondt et al., J Orthop Sports Phys Ther 2020;50:632, PMID 33131391):
// em revisão sistemática de 31 instrumentos clínicos, não há evidência suficiente para
// recomendar nenhum instrumento de avaliação da função da escápula; a validade de critério para
// postura assimétrica, amplitude e teste de deslizamento lateral foi insuficiente, e os
// instrumentos de "discinesia" estão sujeitos a má interpretação. Por isso:
//  - não há corte de normalidade nem classificação; só valores e diferenças entre os lados;
//  - nunca se usa o termo "discinesia" nem se conclui sobre dor ou função;
//  - o valor serve para comparar o MESMO paciente, com a mesma técnica, ao longo do tempo.

export type PontoFoto = { x: number; y: number };

export type ChavePontoEscapula = "c7" | "sacro" | "ai_d" | "ai_e" | "rs_d" | "rs_e" | "cal_a" | "cal_b";

export type MarcacaoEscapula = Partial<Record<ChavePontoEscapula, PontoFoto>> & { cal_cm?: number };

// Ordem de marcação: o rótulo diz exatamente o que clicar (lado = lado do PACIENTE).
export const PASSOS_ESCAPULA: { chave: ChavePontoEscapula; rotulo: string; dica: string }[] = [
  { chave: "c7", rotulo: "C7 (processo espinhoso da base do pescoço)", dica: "Ponto ósseo mais saliente da base do pescoço, com o pescoço relaxado." },
  { chave: "sacro", rotulo: "Início da prega entre os glúteos (ou S2)", dica: "Define, com C7, a linha média das costas." },
  { chave: "ai_d", rotulo: "Ângulo inferior da escápula DIREITA do paciente", dica: "Ponta inferior do osso, palpada com o paciente relaxado." },
  { chave: "ai_e", rotulo: "Ângulo inferior da escápula ESQUERDA do paciente", dica: "Ponta inferior do osso, palpada com o paciente relaxado." },
  { chave: "rs_d", rotulo: "Raiz da espinha da escápula DIREITA (borda medial)", dica: "Onde a espinha da escápula encontra a borda medial, perto da coluna." },
  { chave: "rs_e", rotulo: "Raiz da espinha da escápula ESQUERDA (borda medial)", dica: "Onde a espinha da escápula encontra a borda medial, perto da coluna." },
  { chave: "cal_a", rotulo: "Referência de escala: ponto A (opcional)", dica: "Dois adesivos ou uma régua colados na pele, a distância conhecida, dão as medidas em cm." },
  { chave: "cal_b", rotulo: "Referência de escala: ponto B (opcional)", dica: "Segundo ponto da referência de escala." },
];

export type MedidaEscapula = { id: string; rotulo: string; texto: string };

// Inclinação (°) da reta entre dois pontos em relação à horizontal.
function inclinacaoGraus(a: PontoFoto, b: PontoFoto): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

// Distância perpendicular (px) de um ponto à reta que passa por a e b.
function distanciaARetaPx(p: PontoFoto, a: PontoFoto, b: PontoFoto): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const comp = Math.hypot(dx, dy);
  if (comp === 0) return 0;
  return Math.abs(dx * (a.y - p.y) - (a.x - p.x) * dy) / comp;
}

const fmt = (n: number, c = 1) => n.toFixed(c).replace(".", ",");

export function medirEscapula(m: MarcacaoEscapula): { medidas: MedidaEscapula[]; escalaCm: number | null; faltam: string[] } {
  const medidas: MedidaEscapula[] = [];
  const faltam: string[] = [];
  // pixels por cm, se os dois pontos de escala e o comprimento foram informados.
  let pxPorCm: number | null = null;
  if (m.cal_a && m.cal_b && m.cal_cm && m.cal_cm > 0) {
    const px = Math.hypot(m.cal_b.x - m.cal_a.x, m.cal_b.y - m.cal_a.y);
    if (px > 0) pxPorCm = px / m.cal_cm;
  }
  const cm = (px: number) => (pxPorCm ? `${fmt(px / pxPorCm)} cm` : null);

  // Linhas que ligam os dois lados. A leitura é "o lado X do paciente está mais alto" e não depende
  // de qual lado aparece à esquerda da foto, porque cada ponto foi marcado já com o lado do paciente.
  const par = (id: string, rotulo: string, d?: PontoFoto, e?: PontoFoto) => {
    if (!d || !e) return;
    const ang = inclinacaoGraus({ x: 0, y: 0 }, { x: Math.abs(e.x - d.x), y: Math.abs(e.y - d.y) });
    // y cresce para baixo: o ponto com menor y está mais alto. Os pontos já vêm rotulados pelo lado do paciente.
    const ladoMaisAlto = d.y === e.y ? null : d.y < e.y ? "direito" : "esquerdo";
    const difVert = Math.abs(d.y - e.y);
    medidas.push({
      id,
      rotulo,
      texto: `inclinação de ${fmt(ang)}°${ladoMaisAlto ? ` (lado ${ladoMaisAlto} do paciente mais alto${pxPorCm ? `, diferença vertical de ${cm(difVert)}` : ""})` : " (nivelado)"}`,
    });
  };
  par("linha_ai", "Linha dos ângulos inferiores", m.ai_d, m.ai_e);
  par("linha_rs", "Linha das raízes da espinha", m.rs_d, m.rs_e);

  // Distância à linha média (C7 - sacro).
  if (m.c7 && m.sacro) {
    const dist = (p?: PontoFoto) => (p ? distanciaARetaPx(p, m.c7!, m.sacro!) : null);
    const pares: [string, string, PontoFoto | undefined, PontoFoto | undefined][] = [
      ["dist_ai", "Distância do ângulo inferior à linha média", m.ai_d, m.ai_e],
      ["dist_rs", "Distância da raiz da espinha à linha média", m.rs_d, m.rs_e],
    ];
    for (const [id, rotulo, pd, pe] of pares) {
      const dd = dist(pd);
      const de = dist(pe);
      if (dd === null || de === null) continue;
      const razao = de > 0 ? dd / de : null;
      const partes = [pxPorCm ? `D ${cm(dd)} · E ${cm(de)} · diferença ${cm(Math.abs(dd - de))}` : null, razao !== null ? `razão D/E ${fmt(razao, 2)}` : null].filter(Boolean);
      medidas.push({ id, rotulo, texto: partes.join(" · ") });
    }
  } else if (m.ai_d || m.ai_e || m.rs_d || m.rs_e) {
    faltam.push("C7 e prega entre os glúteos (linha média) para medir distâncias");
  }
  if (medidas.length === 0) faltam.push("marcar ao menos os dois ângulos inferiores");
  return { medidas, escalaCm: pxPorCm, faltam };
}

export function temMarcacaoEscapula(m: MarcacaoEscapula | undefined): boolean {
  return !!m && (["ai_d", "ai_e", "rs_d", "rs_e"] as ChavePontoEscapula[]).some((k) => !!m[k]);
}
