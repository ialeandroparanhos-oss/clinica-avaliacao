// Anamnese feita na clínica (modo clínica): as perguntas do questionário foram escritas para o paciente
// responder em casa ("você"). Aqui ficam as MESMAS perguntas em terceira pessoa ("a pessoa"), para o avaliador
// ler na entrevista. "A pessoa" vale para paciente e para aluno. Só muda o texto exibido nas perguntas, nos
// títulos e nas instruções: as opções de resposta e tudo o que é gravado continuam exatamente iguais, então os
// dados, os alertas e os cálculos não mudam. Texto sem tradução aqui aparece como está.

const T: Record<string, string> = {
  // títulos e subtítulos das etapas
  "Sobre você": "Sobre a pessoa",
  "Um pouco do seu contexto diário.": "Um pouco do contexto diário dela.",
  "O que te trouxe até aqui": "O motivo da procura",
  "Queremos entender de verdade o que você busca.": "Entender de verdade o que a pessoa busca.",
  "Sua saúde": "Saúde",
  "Só o essencial para a gente cuidar de você com segurança.": "Só o essencial para cuidar da pessoa com segurança.",
  "Se houver dor, mostre no desenho onde e o quanto incomoda.": "Se houver dor, a pessoa mostra no desenho onde e o quanto incomoda.",
  "Algumas perguntas rápidas sobre o seu dia a dia.": "Algumas perguntas rápidas sobre o dia a dia da pessoa.",
  "Confira e envie suas respostas.": "Confira e envie as respostas.",
  // contexto
  "Qual sua profissão?": "Qual a profissão da pessoa?",
  "Como é sua rotina diária, de forma geral?": "Como é a rotina diária da pessoa, de forma geral?",
  "Seu trabalho exige esforço físico?": "O trabalho da pessoa exige esforço físico?",
  // motivo
  "O que te motivou a procurar a clínica?": "O que motivou a pessoa a procurar a clínica?",
  "Qual sua principal queixa hoje?": "Qual a principal queixa da pessoa hoje?",
  "Você sente dificuldade em alguma destas situações do dia a dia? (pode marcar mais de uma)": "A pessoa sente dificuldade em alguma destas situações do dia a dia? (pode marcar mais de uma)",
  "Existe alguma atividade que você deixou de fazer por causa de alguma limitação?": "Existe alguma atividade que a pessoa deixou de fazer por causa de alguma limitação?",
  "O que você gostaria de melhorar ou alcançar com este acompanhamento?": "O que a pessoa gostaria de melhorar ou alcançar com este acompanhamento?",
  // saúde
  "Você tem alguma doença diagnosticada?": "A pessoa tem alguma doença diagnosticada?",
  "Já realizou alguma cirurgia?": "A pessoa já realizou alguma cirurgia?",
  "Já teve lesões ou fraturas?": "A pessoa já teve lesões ou fraturas?",
  "Você sofreu alguma queda nos últimos 12 meses?": "A pessoa sofreu alguma queda nos últimos 12 meses?",
  "Você usa algum medicamento atualmente?": "A pessoa usa algum medicamento atualmente?",
  "Para quê você toma?": "Para que a pessoa toma?",
  "Você tem colesterol alto ou usa medicação para colesterol (estatina)?": "A pessoa tem colesterol alto ou usa medicação para colesterol (estatina)?",
  "Você sabe se seu HDL (colesterol bom) é alto (acima de 60)?": "A pessoa sabe se o HDL (colesterol bom) é alto (acima de 60)?",
  "Você tem glicemia alterada (pré-diabetes) ou diabetes?": "A pessoa tem glicemia alterada (pré-diabetes) ou diabetes?",
  "Na sua família (pais, irmãos), já apareceu algum destes? (pode marcar mais de um)": "Na família da pessoa (pais, irmãos), já apareceu algum destes? (pode marcar mais de um)",
  // dor
  "Você sente alguma dor atualmente?": "A pessoa sente alguma dor atualmente?",
  "Você apresenta algum destes sinais junto com a dor? (marque se houver)": "A pessoa apresenta algum destes sinais junto com a dor? (marque se houver)",
  // hábitos
  "Você pratica alguma atividade física atualmente?": "A pessoa pratica alguma atividade física atualmente?",
  "Quantas horas você costuma dormir por noite?": "Quantas horas a pessoa costuma dormir por noite?",
  "Como você avalia a qualidade do seu sono?": "Como a pessoa avalia a qualidade do próprio sono?",
  "Você costuma ter dificuldade para pegar no sono?": "A pessoa costuma ter dificuldade para pegar no sono?",
  "Você costuma acordar durante a noite?": "A pessoa costuma acordar durante a noite?",
  "Você fuma?": "A pessoa fuma?",
  "Nos últimos tempos, o estresse, a ansiedade ou o humor têm atrapalhado o seu dia a dia?": "Nos últimos tempos, o estresse, a ansiedade ou o humor têm atrapalhado o dia a dia da pessoa?",
  // segurança para atividade física (PAR-Q+)
  "Algum médico já disse que você tem uma condição cardíaca ou pressão arterial alta?": "Algum médico já disse que a pessoa tem uma condição cardíaca ou pressão arterial alta?",
  "Você sente dor no peito em repouso, durante atividades da vida diária ou ao fazer esforço físico?": "A pessoa sente dor no peito em repouso, durante atividades da vida diária ou ao fazer esforço físico?",
  "Você perde o equilíbrio por tontura ou já perdeu a consciência nos últimos 12 meses?": "A pessoa perde o equilíbrio por tontura ou já perdeu a consciência nos últimos 12 meses?",
  "Você tem algum problema ósseo ou articular que possa piorar com a atividade física?": "A pessoa tem algum problema ósseo ou articular que possa piorar com a atividade física?",
  "Você toma atualmente algum medicamento prescrito para pressão arterial ou para uma condição cardíaca?": "A pessoa toma atualmente algum medicamento prescrito para pressão arterial ou para uma condição cardíaca?",
  "Existe algum outro motivo, não mencionado, pelo qual você acredita que não deveria realizar atividade física agora?": "Existe algum outro motivo, não mencionado, pelo qual a pessoa acredita que não deveria realizar atividade física agora?",
  "Pode explicar melhor?": "A pessoa pode explicar melhor?",
};

export function terceiraPessoa(texto: string): string {
  return T[texto] ?? texto;
}

// Textos longos das etapas (parágrafos), em primeira e em terceira pessoa.
export const PARAGRAFO_FINAL_PACIENTE =
  "Obrigado por responder com atenção. Ao enviar, sua equipe de saúde vai revisar suas respostas antes da sua avaliação presencial. Se alguma resposta te deixou em dúvida, você pode voltar e ajustar antes de enviar.";
export const PARAGRAFO_FINAL_CLINICA = "Confira as respostas com a pessoa. Ao enviar, elas ficam na ficha, na aba Anamnese. Se alguma resposta ficou em dúvida, volte e ajuste antes de enviar.";

export const PARAGRAFO_BEM_ESTAR_PACIENTE =
  "Esta é só uma pergunta para a gente cuidar de você por inteiro. Se quiser falar mais sobre isso, há um questionário separado e opcional - você decide se e quando responder.";
export const PARAGRAFO_BEM_ESTAR_CLINICA =
  "Esta é só uma pergunta de triagem, para cuidar da pessoa por inteiro. Se ela quiser falar mais sobre isso, há um questionário separado e opcional: ela decide se e quando responder.";

// Chaves que devem existir (usado nos testes para garantir que nenhuma pergunta ficou de fora).
export const PERGUNTAS_TRADUZIDAS = Object.keys(T);
