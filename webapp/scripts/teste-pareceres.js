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
const A = load(root + "/lib/avaliacao/pareceresAuto.ts");
const R = load(root + "/lib/anamnese/resumoTreino.ts");
const base = { id: "x", nome: "Teste Sintetico", sexo: "feminino", data_nascimento: "1990-05-10", anamnese: {}, anamnese_status: "em_andamento", alertas: [], fisica: { peso_kg: "70", altura_cm: "170", circ_cintura: "80", protocolo: "jp7" }, funcional: null, cardio: null, postural: null, plano: {} };
let falhas = 0; const ok = (c, m) => { if (!c) { falhas++; console.log("FALHOU:", m); } else console.log("ok:", m); };
// 1) sem parecer -> gera sucinto
let u = A.atualizacoesAutomaticas(base);
ok(u.some((x) => x.secao === "fisica" && x.valor.estilo === "sucinto" && x.valor.texto.length > 20), "gera parecer fisica sucinto quando nao existe");
ok(A.situacaoParecer(base, "fisica") === "sem", "situacao 'sem'");
// 2) parecer do sistema desatualizado -> acompanha
const t0 = A.atualizacoesAutomaticas(base).find((x) => x.secao === "fisica").valor;
const pOld = { ...base, fisica: { ...base.fisica, peso_kg: "60", parecer: { ...t0 } } };
u = A.atualizacoesAutomaticas(pOld);
ok(u.some((x) => x.secao === "fisica" && x.valor.texto !== t0.texto), "parecer do sistema acompanha os dados");
ok(A.atualizacoesAutomaticas(pOld, ["fisica"]).every((x) => x.secao !== "fisica"), "aba aberta e ignorada");
// 3) editado nao e trocado
const pEd = { ...pOld, fisica: { ...pOld.fisica, parecer: { ...t0, texto: t0.texto + " EDITADO" } } };
ok(A.atualizacoesAutomaticas(pEd).every((x) => x.secao !== "fisica"), "editado nao e trocado");
ok(A.situacaoParecer(pEd, "fisica") === "dados_novos", "editado + dados novos => dados_novos");
// 4) aprovado nao e trocado
const pAp = { ...pOld, fisica: { ...pOld.fisica, parecer: { ...t0, revisado: true } } };
ok(A.atualizacoesAutomaticas(pAp).every((x) => x.secao !== "fisica"), "aprovado nao e trocado");
ok(A.situacaoParecer(pAp, "fisica") === "dados_novos", "aprovado + dados novos => dados_novos");
ok(A.situacaoParecer({ ...base, fisica: { ...base.fisica, parecer: { ...t0, revisado: true } } }, "fisica") === "aprovado", "aprovado em dia");
ok(A.situacaoParecer({ ...base, fisica: { ...base.fisica, parecer: { ...t0 } } }, "fisica") === "revisar", "do sistema em dia => revisar");
ok(A.situacaoParecer(base, "cardio") === "sem_dados", "cardio sem dados");
// apagado pelo avaliador nao regenera
const pAp2 = { ...base, fisica: { ...base.fisica, parecer: { texto: "", estilo: "sucinto", automatico: t0.texto, revisado: false } } };
ok(A.atualizacoesAutomaticas(pAp2).every((x) => x.secao !== "fisica"), "parecer apagado nao regenera");
// estabilidade: depois de aplicar, nao ha nova atualizacao
const pEst = { ...base, fisica: { ...base.fisica, parecer: t0 } };
ok(A.atualizacoesAutomaticas(pEst).every((x) => x.secao !== "fisica"), "estavel apos atualizar");
// 5) esclarecer
const an = { historico_saude: { quedas_12m: true, quedas_detalhe: "", tem_lesoes: true, lesoes_fraturas: "" }, medicamentos: { usa_medicamentos: true, lista: [] }, dor: { tem_dor: true, dor_noturna: true, por_regiao: {}, localizacoes: [] }, motivo: { objetivos: "emagrecer" } };
const pq = { ...base, anamnese: an };
const r = R.montarResumoTreino(pq);
console.log(r.esclarecer.map((e) => e.pergunta + " | " + e.motivo));
ok(r.esclarecer.length >= 5, "regras de esclarecimento disparam");
ok(R.montarResumoTreino(base).esclarecer.length === 0, "anamnese vazia nao gera esclarecimento");
console.log(falhas === 0 ? "TUDO OK" : "FALHAS: " + falhas);

