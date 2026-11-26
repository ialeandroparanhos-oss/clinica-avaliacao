const ts = require("C:/Users/Leandro/Dropbox/Inteligencia Artificial/Clinica/webapp/node_modules/typescript");
const fs = require("fs"); const path = require("path");
const root = "C:/Users/Leandro/Dropbox/Inteligencia Artificial/Clinica/webapp/src";
const cache = {};
function load(file) {
  if (cache[file]) return cache[file].exports;
  const src = fs.readFileSync(file, "utf8");
  const out = ts.transpileModule(src, { compilerOptions: { module: "commonjs", target: "es2020" } }).outputText;
  const m = { exports: {} }; cache[file] = m;
  const req = (spec) => {
    if (spec.startsWith("@/") || spec.startsWith(".")) {
      let f = spec.startsWith(".") ? path.resolve(path.dirname(file), spec) : path.join(root, spec.slice(2));
      for (const ext of [".ts", ".tsx", "/index.ts"]) if (fs.existsSync(f + ext)) return load(f + ext);
      throw new Error("not found " + spec);
    }
    return require(spec);
  };
  new Function("exports", "require", "module", out)(m.exports, req, m);
  return m.exports;
}
// Testes das avaliações fundamentais (Dra. Nina) com pacientes sintéticos: nada é gravado no banco.
const F = load(root + "/lib/avaliacao/avaliacoesFundamentais.ts");
let falhas = 0; const ok = (c, m) => { if (!c) { falhas++; console.log("FALHOU:", m); } else console.log("ok:", m); };
const base = { id: "x", nome: "Teste Sintetico", sexo: "feminino", data_nascimento: "1990-05-10", anamnese_status: "concluida", alertas: [], fisica: {}, funcional: {}, cardio: {}, postural: {}, plano: {} };
const ids = (p) => F.avaliacoesFundamentais(p);
const tem = (l, id, prio) => l.some((i) => i.id === id && (!prio || i.prioridade === prio));

// 0) sem anamnese
ok(ids({ ...base, anamnese: null, anamnese_status: "nao_iniciada" }).length === 0, "sem anamnese nao sugere nada");
// 1) adulta ativa sem queixa: so a base
let l = ids({ ...base, anamnese: { atividade_fisica: { pratica_atual: true, modalidades: "corrida" } } });
ok(tem(l, "fisica.base", "fundamental") && tem(l, "fisica.pa", "fundamental"), "base fundamental");
ok(tem(l, "cardio.esforco", "recomendado"), "ativa sem restricao: teste de esforco recomendado");
ok(!tem(l, "funcional.tug"), "adulta sem queda: sem TUG");
// 2) idosa com queda, sedentaria
l = ids({ ...base, data_nascimento: "1950-01-01", anamnese: { historico_saude: { quedas_12m: true }, atividade_fisica: { pratica_atual: false } } });
for (const id of ["funcional.tug", "funcional.unipodal", "funcional.marcha", "funcional.sentar_levantar", "funcional.dinamometria", "funcional.tc6"]) ok(tem(l, id, "fundamental"), "idosa/queda: " + id);
ok(tem(l, "cardio.evitar_maximo", "evitar"), "sedentaria: evitar maximo");
ok(l.find((i) => i.id === "funcional.tug").fontes.some((f) => f.pmid === "36178003"), "TUG cita a diretriz de quedas");
// 3) feito
const pFeito = { ...base, data_nascimento: "1950-01-01", anamnese: { historico_saude: { quedas_12m: true } }, funcional: { tug_seg: "11,2" }, fisica: { peso_kg: "70", altura_cm: "160", circ_cintura: "90" } };
l = ids(pFeito);
ok(l.find((i) => i.id === "funcional.tug").feito === true, "TUG preenchido = feito");
ok(l.find((i) => i.id === "fisica.base").feito === true, "base preenchida = feita");
ok(!F.pendentesFundamentais(l).some((i) => i.id === "funcional.tug"), "TUG sai das pendencias");
// 4) dor forte no joelho e lombar, ombro
l = ids({ ...base, anamnese: { dor: { tem_dor: true, por_regiao: { "Joelho direito": { intensidade: 8, duracao: "" }, "Coluna lombar": { intensidade: 7, duracao: "" }, "Ombro esquerdo": { intensidade: 3, duracao: "" } } } } });
ok(tem(l, "funcional.agachamento", "fundamental") && tem(l, "postural.fotos", "fundamental"), "joelho: agachamento e fotos fundamentais");
ok(tem(l, "cardio.evitar_corrida", "evitar"), "joelho forte: evitar Cooper");
ok(tem(l, "postural.flexao_tronco", "fundamental") && tem(l, "funcional.evitar_prancha", "evitar"), "lombar forte: flexao de tronco e evitar prancha");
ok(tem(l, "funcional.gonio_ombro", "fundamental") && !tem(l, "funcional.evitar_pushup"), "ombro leve: goniometria sem evitar push-up");
ok(tem(l, "anamnese.mod_dor", "fundamental"), "dor: modulo dor fundamental");
console.log(l.find((i) => i.id === "postural.fotos").motivos);
// 5) sintomas no PAR-Q: liberacao necessaria
l = ids({ ...base, anamnese: { prontidao: { parq: { chest_pain: true } }, atividade_fisica: { pratica_atual: false } } });
ok(tem(l, "cardio.evitar_esforco", "evitar"), "sintoma: evitar testes de esforco");
ok(!tem(l, "funcional.tc6", "fundamental"), "sintoma: TC6 nao e fundamental");
// 6) pressao alta + treina musculacao
l = ids({ ...base, anamnese: { prontidao: { parq: { bp_or_heart_med: true } }, atividade_fisica: { pratica_atual: true, modalidades: "musculação" } } });
ok(tem(l, "funcional.rm", "fundamental") && tem(l, "funcional.evitar_falha", "evitar") && !tem(l, "funcional.falha"), "pressao alta: RM sim, falha evitada");
ok(tem(l, "cardio.evitar_maximo", "evitar"), "remedio de pressao (doenca conhecida): evitar maximo");
// 7) objetivo emagrecer
l = ids({ ...base, anamnese: { motivo: { objetivos: "Quero emagrecer e definir" } } });
ok(tem(l, "fisica.composicao", "fundamental") && tem(l, "fisica.circ_membros", "fundamental"), "objetivo composicao");
// 8) sono ruim
l = ids({ ...base, anamnese: { sono: { qualidade_percebida: 1 } } });
ok(tem(l, "anamnese.mod_sono", "fundamental"), "sono ruim: modulo sono");
console.log(falhas === 0 ? "TUDO OK" : "FALHAS: " + falhas);
