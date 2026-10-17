// Agente 4 (Dra. Paula): ANÁLISE DE MOVIMENTO. Complementa a postura estática: o paciente executa um movimento
// (por exemplo, a flexão de tronco) e o avaliador registra o ponto máximo em duas vistas, a sagital (de lado)
// e a frontal (de frente ou de costas). O registro é DESCRITIVO e aparente à inspeção: as listas de
// observação são um roteiro prático do sistema, sem corte nem validação publicada; não definem diagnóstico
// nem causa de dor. O ângulo medido na foto é 2D e depende do enquadramento da câmera.

import type { ResumoVideo } from "./videoMovimento";

export type VistaMov = "sagital" | "frontal";
export const VISTAS_MOV: VistaMov[] = ["sagital", "frontal"];
export const ROTULO_VISTA_MOV: Record<VistaMov, string> = { sagital: "Vista sagital (de lado)", frontal: "Vista frontal" };

export type OpcaoObs = { chave: string; rotulo: string };

export type DefMovimento = {
  id: string;
  nome: string;
  como: string; // como executar e posicionar
  observacoes: Record<VistaMov, OpcaoObs[]>;
  medida?: { rotulo: string; unidade: string; dica: string };
};

export const MOVIMENTOS: DefMovimento[] = [
  {
    id: "flexao_tronco",
    nome: "Flexão de tronco (inclinar à frente)",
    como: "Em pé, pés na largura do quadril e joelhos estendidos, o paciente inclina o tronco à frente, com os braços soltos, até o ponto máximo confortável. Foto no ponto máximo: de lado (sagital) e de costas (frontal), com a câmera na altura do quadril e a mesma distância nas reavaliações.",
    observacoes: {
      sagital: [
        { chave: "curva_continua", rotulo: "Curva distribuída entre quadril e coluna (aspecto contínuo)" },
        { chave: "predomina_lombar", rotulo: "Flexão concentrada na coluna lombar, com pouca flexão de quadril" },
        { chave: "predomina_quadril", rotulo: "Flexão concentrada no quadril, com coluna pouco curvada (aspecto rígido)" },
        { chave: "pelve_nao_recua", rotulo: "Pelve não recua (quadril não vai para trás)" },
        { chave: "joelhos_fletem", rotulo: "Joelhos flexionam para compensar" },
        { chave: "cervical", rotulo: "Cabeça e pescoço: queda exagerada ou rigidez cervical" },
        { chave: "amplitude_limitada", rotulo: "Amplitude limitada (mãos não passam dos joelhos)" },
        { chave: "retorno_com_apoio", rotulo: "Retorno com perda de controle ou apoio das mãos nas coxas" },
        { chave: "dor", rotulo: "Dor ou desconforto durante o movimento" },
      ],
      frontal: [
        { chave: "simetrico", rotulo: "Tronco simétrico durante todo o movimento" },
        { chave: "desvio_d", rotulo: "Desvio lateral do tronco para a direita" },
        { chave: "desvio_e", rotulo: "Desvio lateral do tronco para a esquerda" },
        { chave: "costelas_assim", rotulo: "Elevação de um dos lados das costas (assimetria do gradil costal)" },
        { chave: "ombros_assim", rotulo: "Assimetria de ombros ou de escápulas" },
        { chave: "pelve_inclina", rotulo: "Pelve inclina ou eleva de um lado" },
        { chave: "peso_desigual", rotulo: "Peso desigual entre os pés" },
        { chave: "joelhos_eixo", rotulo: "Joelhos desviam do eixo (para dentro ou para fora)" },
      ],
    },
    medida: { rotulo: "Distância dedos-chão", unidade: "cm", dica: "Do dedo médio ao chão, no ponto máximo (0 = toca o chão)." },
  },
  {
    id: "extensao_tronco",
    nome: "Extensão de tronco (inclinar para trás)",
    como: "Em pé, mãos na cintura, o paciente inclina o tronco para trás até o ponto máximo confortável. Foto de lado (sagital) e de frente (frontal).",
    observacoes: {
      sagital: [
        { chave: "distribuida", rotulo: "Extensão distribuída entre as regiões da coluna" },
        { chave: "lombar", rotulo: "Extensão concentrada na lombar, com pouca extensão torácica" },
        { chave: "quadril_avanca", rotulo: "Pelve avança e joelhos estendem para compensar" },
        { chave: "amplitude_limitada", rotulo: "Amplitude limitada" },
        { chave: "dor", rotulo: "Dor ou desconforto durante o movimento" },
      ],
      frontal: [
        { chave: "simetrico", rotulo: "Tronco simétrico durante o movimento" },
        { chave: "desvio_d", rotulo: "Desvio lateral do tronco para a direita" },
        { chave: "desvio_e", rotulo: "Desvio lateral do tronco para a esquerda" },
        { chave: "ombros_assim", rotulo: "Assimetria de ombros" },
      ],
    },
  },
  {
    id: "inclinacao_lateral",
    nome: "Inclinação lateral de tronco",
    como: "Em pé, o paciente desliza a mão pela lateral da coxa, inclinando o tronco para o lado, sem girar nem se inclinar à frente. Uma foto para cada lado; a vista frontal é a principal.",
    observacoes: {
      sagital: [
        { chave: "sem_flexao", rotulo: "Tronco inclina sem flexão nem extensão associadas" },
        { chave: "flexao_assoc", rotulo: "Flexão de tronco associada à inclinação" },
        { chave: "extensao_assoc", rotulo: "Extensão de tronco associada à inclinação" },
      ],
      frontal: [
        { chave: "simetrico", rotulo: "Curvatura lateral simétrica entre os lados" },
        { chave: "menos_d", rotulo: "Menor inclinação para a direita" },
        { chave: "menos_e", rotulo: "Menor inclinação para a esquerda" },
        { chave: "quebra_curva", rotulo: "Curva com ponto de angulação (não contínua)" },
        { chave: "pelve_desloca", rotulo: "Pelve desloca para o lado oposto de forma marcada" },
        { chave: "dor", rotulo: "Dor ou desconforto durante o movimento" },
      ],
    },
  },
  {
    id: "agachamento",
    nome: "Agachamento (sem carga)",
    como: "Em pé, pés na largura dos ombros, braços à frente, o paciente agacha até onde conseguir manter o controle e volta. Foto no ponto mais baixo: de lado (sagital) e de frente (frontal).",
    observacoes: {
      sagital: [
        { chave: "calcanhares", rotulo: "Calcanhares perdem o contato com o chão" },
        { chave: "tronco_a_frente", rotulo: "Tronco inclina muito à frente" },
        { chave: "lombar_perde_curva", rotulo: "Coluna lombar perde a curva ao final do movimento" },
        { chave: "amplitude_limitada", rotulo: "Amplitude limitada (não alcança a profundidade esperada)" },
        { chave: "peso_nos_dedos", rotulo: "Peso desloca-se para a ponta dos pés" },
        { chave: "dor", rotulo: "Dor ou desconforto durante o movimento" },
      ],
      frontal: [
        { chave: "joelho_d_dentro", rotulo: "Joelho direito desloca-se para dentro" },
        { chave: "joelho_e_dentro", rotulo: "Joelho esquerdo desloca-se para dentro" },
        { chave: "pes_abrem", rotulo: "Pés abrem (rotação externa) ao descer" },
        { chave: "desvio_lateral", rotulo: "Desvio ou deslocamento lateral do tronco ou da pelve" },
        { chave: "ombros_assim", rotulo: "Assimetria de ombros" },
        { chave: "simetrico", rotulo: "Movimento simétrico entre os lados" },
      ],
    },
  },
  {
    id: "elevacao_bracos",
    nome: "Elevação dos braços acima da cabeça",
    como: "Em pé, o paciente eleva os dois braços à frente e acima da cabeça, cotovelos estendidos, até o ponto máximo. Foto de lado (sagital) e de costas (frontal).",
    observacoes: {
      sagital: [
        { chave: "lombar_estende", rotulo: "Lombar estende (costelas abrem) para completar o movimento" },
        { chave: "cabeca_projeta", rotulo: "Cabeça projeta à frente" },
        { chave: "amplitude_limitada", rotulo: "Amplitude limitada de elevação" },
        { chave: "dor", rotulo: "Dor ou desconforto durante o movimento" },
      ],
      frontal: [
        { chave: "encolhe", rotulo: "Ombros sobem (encolhem) durante a elevação" },
        { chave: "bracos_assim", rotulo: "Um braço sobe menos que o outro" },
        { chave: "inclina_lado", rotulo: "Tronco inclina para um lado para completar" },
        { chave: "escapulas_assim", rotulo: "Escápulas com comportamento diferente entre os lados" },
        { chave: "simetrico", rotulo: "Elevação simétrica entre os lados" },
      ],
    },
  },
];

export const MOVIMENTO_POR_ID = new Map(MOVIMENTOS.map((m) => [m.id, m]));

// ---------------------------------------------------------------------------
// Dados salvos (em postural.movimentos)
// ---------------------------------------------------------------------------
export type PontoImg = { x: number; y: number };
export type MedidaAngulo = {
  tipo: "tres_pontos" | "vertical";
  pts: PontoImg[]; // em pixels da foto
  largura: number;
  altura: number;
};
export type VistaMovSalva = {
  foto_path?: string;
  obs?: string[]; // chaves marcadas
  texto?: string; // observação livre
  angulo?: MedidaAngulo;
  video_path?: string; // vídeo guardado no arquivo privado (opcional)
  analise_video?: ResumoVideo; // análise inicial automática do vídeo
};
export type MovimentoSalvo = Partial<Record<VistaMov, VistaMovSalva>> & { medida?: string; ativo?: boolean };
export type Movimentos = Record<string, MovimentoSalvo>;

// ---------------------------------------------------------------------------
// Ângulo medido na foto (2D)
// ---------------------------------------------------------------------------
export function anguloDe(m: MedidaAngulo | undefined): number | null {
  if (!m) return null;
  if (m.tipo === "tres_pontos") {
    if (m.pts.length < 3) return null;
    const [a, v, b] = m.pts;
    const ux = a.x - v.x, uy = a.y - v.y, wx = b.x - v.x, wy = b.y - v.y;
    const nu = Math.hypot(ux, uy), nw = Math.hypot(wx, wy);
    if (nu === 0 || nw === 0) return null;
    const c = Math.max(-1, Math.min(1, (ux * wx + uy * wy) / (nu * nw)));
    return (Math.acos(c) * 180) / Math.PI;
  }
  if (m.pts.length < 2) return null;
  const [a, b] = m.pts;
  const dx = b.x - a.x, dy = b.y - a.y;
  if (dx === 0 && dy === 0) return null;
  // Desvio da linha em relação à vertical da foto: 0° = vertical.
  return (Math.atan2(Math.abs(dx), Math.abs(dy)) * 180) / Math.PI;
}

export function pontosNecessarios(tipo: MedidaAngulo["tipo"]): number {
  return tipo === "tres_pontos" ? 3 : 2;
}

// ---------------------------------------------------------------------------
// Texto para o parecer
// ---------------------------------------------------------------------------
function f(n: number, casas = 0) {
  return n.toFixed(casas).replace(".", ",");
}

export function temMovimento(movimentos: Movimentos | undefined): boolean {
  if (!movimentos) return false;
  return MOVIMENTOS.some((def) => {
    const m = movimentos[def.id];
    if (!m) return false;
    return !!m.medida || VISTAS_MOV.some((v) => (m[v]?.obs?.length ?? 0) > 0 || !!m[v]?.texto || !!m[v]?.foto_path || !!m[v]?.angulo || !!m[v]?.analise_video);
  });
}

export function descreverMovimentos(movimentos: Movimentos | undefined): string[] {
  if (!movimentos) return [];
  const linhas: string[] = [];
  for (const def of MOVIMENTOS) {
    const m = movimentos[def.id];
    if (!m) continue;
    const partes: string[] = [];
    for (const v of VISTAS_MOV) {
      const sv = m[v];
      if (!sv) continue;
      const obs = (sv.obs ?? []).map((k) => def.observacoes[v].find((o) => o.chave === k)?.rotulo).filter(Boolean) as string[];
      const ang = anguloDe(sv.angulo);
      const itens: string[] = [];
      if (obs.length > 0) itens.push(obs.join("; "));
      if (ang !== null) itens.push(`ângulo medido na foto ${f(ang)}°${sv.angulo?.tipo === "vertical" ? " em relação à vertical" : ""}`);
      if (sv.texto?.trim()) itens.push(`anotação: ${sv.texto.trim()}`);
      if (sv.analise_video?.adequacao) itens.push(`adequação do vídeo para leitura: ${sv.analise_video.adequacao.resumo}`);
      if (sv.analise_video && sv.analise_video.linhas.length > 0) {
        itens.push(`análise inicial automática do vídeo (2D, a confirmar pelo avaliador): ${sv.analise_video.linhas.join("; ")}${sv.analise_video.avisos.length > 0 ? ` [atenção: ${sv.analise_video.avisos.join(" ")}]` : ""}`);
      }
      if (itens.length > 0) partes.push(`${ROTULO_VISTA_MOV[v].toLowerCase()}: ${itens.join(" | ")}`);
      else if (sv.foto_path) partes.push(`${ROTULO_VISTA_MOV[v].toLowerCase()}: foto registrada, sem observações marcadas`);
    }
    if (m.medida && def.medida) partes.push(`${def.medida.rotulo.toLowerCase()}: ${m.medida.replace(".", ",")} ${def.medida.unidade}`);
    if (partes.length > 0) linhas.push(`${def.nome}. ${partes.join(". ")}.`);
  }
  return linhas;
}
