"use client";

// Instruções rápidas de aplicação dos testes, em português, exibidas num
// popover (i) ao lado do rótulo de cada teste.

import { useState } from "react";

// Instruções de aplicação em português, para o avaliador consultar sem sair
// da tela - não é protocolo oficial fechado, é um lembrete rápido de campo.
export const INSTRUCOES_TESTE: Record<string, string> = {
  chair_stand:
    "Paciente sentado numa cadeira sem apoio de braço, com os braços cruzados sobre o peito. Conte quantas vezes ele consegue levantar e sentar completamente em 30 segundos.",
  five_sts:
    "Mesma posição do Chair Stand. Cronometre o tempo que o paciente leva para levantar e sentar 5 vezes seguidas, o mais rápido possível, sem usar os braços.",
  tug: "Paciente sentado numa cadeira com apoio de braço. Ao sinal, ele se levanta, caminha 3 metros, dá a volta, retorna e senta novamente. Cronometre o tempo total.",
  apoio_unipodal:
    "Peça para o paciente ficar em pé sobre uma perna, sem apoio, olhos abertos. Cronometre até ele perder o equilíbrio ou tocar o chão com o outro pé. Repita para o outro lado.",
  velocidade_marcha:
    "Marque um percurso de 4 a 10 metros em piso plano (de preferência com 1-2 m extras antes e depois para aceleração/desaceleração). Peça para o paciente caminhar no ritmo habitual dele e cronometre só o trecho marcado. Informe a distância e o tempo: o sistema calcula os m/s.",
  tc6: "Em um corredor marcado (geralmente 30m), peça para o paciente caminhar o mais rápido possível, sem correr, durante 6 minutos. Registre a distância total percorrida.",
  dinamometria:
    "Com o dinamômetro de preensão manual, braço ao lado do corpo, cotovelo a 90°. Peça para apertar com força máxima. Registre o melhor de 2-3 tentativas por lado.",
  pushup:
    "Posição de flexão de braço padrão, ou apoiada nos joelhos (modificada) quando necessário. Conte o máximo de repetições com boa técnica, sem pausa prolongada, até a falha ou esgotamento.",
  arm_curl:
    "Sentado, com halter leve (referência do Senior Fitness Test: 2,3 kg (5 lb) mulheres / 3,6 kg (8 lb) homens, ajuste pelo condicionamento do paciente). Conte quantas flexões de cotovelo completas ele consegue fazer em 30 segundos (Arm Curl Test, Senior Fitness Test).",
  rm_submaximo:
    "Escolha uma carga que o paciente consiga mover entre 3 e 10 vezes com boa técnica, perto da falha. Registre a carga e as repetições - o sistema estima o 1RM pela fórmula de Brzycki.",
  falha_carga_fixa:
    "Escolha uma carga fixa (geralmente mais leve que o teste de RM submáximo) e peça o máximo de repetições possível com boa técnica até a falha. Útil para acompanhar resistência muscular com a mesma carga ao longo do tempo.",
  goniometria:
    "Posicione o goniômetro no eixo articular, alinhando os braços fixo e móvel conforme o movimento avaliado. Registre o ângulo máximo atingido (anote nas observações se foi ativo ou passivo).",
  agachamento_livre:
    "Peça para o paciente agachar livremente, sem carga, até onde conseguir com conforto. Observe profundidade, alinhamento do joelho (valgo/varo), compensações no tronco e nos tornozelos.",
  core_prancha:
    "Paciente em posição de prancha (apoio nos antebraços e pés, corpo alinhado da cabeça aos calcanhares). Cronometre até ele perder a postura correta (quadril cair ou subir, tremores excessivos).",
  sit_and_reach:
    "Sentado no chão ou no banco de Wells, pernas estendidas e pés apoiados na caixa. Com os joelhos esticados, o paciente se inclina à frente o máximo possível, mãos sobrepostas. Meça a distância alcançada em relação à ponta dos pés (positivo = além dos pés, negativo = aquém).",
  chair_sit_reach:
    "Sentado na ponta de uma cadeira, uma perna estendida com o calcanhar no chão, a outra dobrada. Ele se inclina à frente tentando tocar a ponta do pé da perna estendida. Meça a distância entre a ponta dos dedos e a ponta do pé (negativo se não alcançar, positivo se ultrapassar) - adaptação para idosos (Senior Fitness Test, Rikli & Jones).",
  back_scratch:
    "Uma mão por cima do ombro (palma nas costas, dedos para baixo) e a outra por trás da cintura (palma para fora, dedos para cima), tentando tocar os dedos das duas mãos atrás das costas. Meça a distância entre os dedos médios (negativo = não se tocam, positivo = sobrepõem). Repita dos dois lados (Senior Fitness Test, Rikli & Jones).",
  bruce_protocolo:
    "Teste progressivo em esteira com inclinação, 7 estágios de 3 minutos cada (velocidade e inclinação aumentam a cada estágio). Continue até o paciente atingir exaustão voluntária ou um critério de interrupção. Registre a FC ao final de cada estágio completado e o tempo total até a parada (em minutos decimais, ex.: 9min30s = 9.5).",
  rampa_protocolo:
    "Esteira sem inclinação (0%). Comece numa velocidade confortável (ex.: 6-8 km/h) e aumente cerca de 1 km/h a cada 1-2 minutos, sem pausas, até a exaustão. A velocidade do último estágio completado é a vVO2máx.",
  cooper_protocolo:
    "Teste de campo: o paciente percorre a maior distância possível em 12 minutos, correndo ou caminhando conforme sua capacidade, em pista ou esteira sem inclinação. Registre a distância total percorrida.",
};

export function InfoPopover({ texto }: { texto: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <span className="relative inline-block align-middle ml-1">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setAberto((v) => !v);
        }}
        className="w-4 h-4 inline-flex items-center justify-center rounded-full bg-accent/15 text-accent-dark text-[10px] font-bold leading-none hover:bg-accent/25"
        aria-label="Como aplicar este teste"
      >
        i
      </button>
      {aberto && (
        <span className="absolute z-20 top-6 left-0 w-64 rounded-lg border border-border bg-surface shadow-lg p-3 text-xs font-normal normal-case text-ink whitespace-normal block text-left">
          {texto}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setAberto(false);
            }}
            className="block mt-2 text-accent-dark text-xs font-medium"
          >
            Fechar
          </button>
        </span>
      )}
    </span>
  );
}

export function RotuloComInfo({ texto, chave }: { texto: string; chave: keyof typeof INSTRUCOES_TESTE }) {
  return (
    <>
      {texto}
      <InfoPopover texto={INSTRUCOES_TESTE[chave]} />
    </>
  );
}
