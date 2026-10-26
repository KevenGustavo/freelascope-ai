/**
 * FreelaScope AI — js/main.js
 * Controlador Principal e Orquestrador de Interface (Vanilla JS)
 *
 * Diretrizes Mandatórias do Projeto:
 * 1. Zero innerHTML: Renderização e limpeza estritamente via replaceChildren(),
 *    cloneNode(true) e textContent para prevenir vulnerabilidades XSS.
 * 2. Arquitetura Modular: Conecta UI semântica aos módulos api.js, calculator.js,
 *    fallback.js e storage.js.
 * 3. UX de Alto Nível: Preenchimento de presets em 1 clique, recálculo em tempo real
 *    ao alterar taxa horária/senioridade, prevenção de duplicatas no histórico e idempotência.
 */

import { PRESETS_PROJETO } from "./fallback.js";
import {
  calcularOrcamento,
  formatarBRL,
  formatarUSD,
  formatarCotacao
} from "./calculator.js";
import { consultarEscopoECambio } from "./api.js";
import {
  obterHistorico,
  salvarOrcamento,
  buscarOrcamentoDuplicado,
  buscarOrcamentoPorId,
  removerOrcamento,
  limparHistorico
} from "./storage.js";

/* ==========================================================================
   Estado da Aplicação
   ========================================================================== */
const estado = {
  senioridade: "pleno",
  chipsSelecionados: new Set(),
  orcamentoAtual: null,
  emProcessamento: false
};

/* ==========================================================================
   Seletores do DOM
   ========================================================================== */
const elementos = {
  // Status do Header
  statusRede: document.getElementById("status-rede"),
  statusTexto: document.getElementById("status-texto"),

  // Formulário e Entradas
  form: document.getElementById("form-orcamento"),
  botoesPreset: document.querySelectorAll(".btn-template"),
  botoesSenioridade: document.querySelectorAll(".btn-seniority"),
  valorHoraInput: document.getElementById("valor-hora"),
  botoesChips: document.querySelectorAll(".chip"),
  descricaoInput: document.getElementById("descricao-projeto"),
  charCounter: document.getElementById("char-counter"),
  erroValidacao: document.getElementById("erro-validacao"),
  btnCalcular: document.getElementById("btn-calcular"),
  btnCalcularTexto: document.getElementById("btn-calcular-texto"),

  // Painéis de Resultado
  estadoVazio: document.getElementById("estado-vazio"),
  estadoLoading: document.getElementById("estado-loading"),
  loadingMensagem: document.getElementById("loading-mensagem"),
  secaoResultado: document.getElementById("secao-resultado"),
  bannerFallback: document.getElementById("banner-fallback"),
  bannerFallbackMotivo: document.getElementById("banner-fallback-motivo"),

  // Campos do Resultado Financeiro
  resNomeProjeto: document.getElementById("res-nome-projeto"),
  resDescricao: document.getElementById("res-descricao"),
  resCotacaoUsd: document.getElementById("res-cotacao-usd"),
  resTotalFinalBrl: document.getElementById("res-total-final-brl"),
  resTotalFinalUsd: document.getElementById("res-total-final-usd"),
  resTotalHoras: document.getElementById("res-total-horas"),
  resCustoBase: document.getElementById("res-custo-base"),
  resDetalheTaxa: document.getElementById("res-detalhe-taxa"),
  resMargemSeguranca: document.getElementById("res-margem-seguranca"),
  listaModulosCorpo: document.getElementById("lista-modulos-corpo"),

  // Ações do Resultado
  btnSalvarOrcamento: document.getElementById("btn-salvar-orcamento"),
  btnNovoCalculo: document.getElementById("btn-novo-calculo"),

  // Histórico
  historicoContador: document.getElementById("historico-contador"),
  btnLimparHistorico: document.getElementById("btn-limpar-historico"),
  historicoLista: document.getElementById("historico-lista"),
  historicoVazio: document.getElementById("historico-vazio"),

  // Templates HTML5
  templateModuloLinha: document.getElementById("template-modulo-linha"),
  templateHistoricoItem: document.getElementById("template-historico-item")
};

/* ==========================================================================
   Funções de Feedback e Indicador de Status
   ========================================================================== */
function atualizarStatusRede(tipo, mensagem) {
  if (!elementos.statusRede || !elementos.statusTexto) return;

  const dot = elementos.statusRede.querySelector(".status-dot");
  if (dot) {
    dot.className = "status-dot";
    if (tipo === "loading") dot.classList.add("status-loading");
    else if (tipo === "error") dot.classList.add("status-error");
    else dot.classList.add("status-idle");
  }

  elementos.statusTexto.textContent = mensagem;
}

function exibirErroValidacao(mensagem) {
  if (!elementos.erroValidacao) return;
  elementos.erroValidacao.textContent = mensagem;
  elementos.erroValidacao.hidden = false;
  elementos.descricaoInput?.setAttribute("aria-invalid", "true");
}

function limparErroValidacao() {
  if (!elementos.erroValidacao) return;
  elementos.erroValidacao.textContent = "";
  elementos.erroValidacao.hidden = true;
  elementos.descricaoInput?.removeAttribute("aria-invalid");
}

/* ==========================================================================
   Controles do Formulário (Senioridade, Chips e Presets)
   ========================================================================== */
function definirValorHora(valor, atualizarInput = true) {
  const taxaNumerica = Math.max(10, Math.min(2000, Number(valor) || 100));

  if (atualizarInput && elementos.valorHoraInput) {
    elementos.valorHoraInput.value = String(taxaNumerica);
  }

  // Sincroniza visualmente os botões de senioridade
  let achouCorrespondente = false;
  elementos.botoesSenioridade.forEach(btn => {
    const valorBotao = Number(btn.dataset.valor);
    if (valorBotao === taxaNumerica) {
      btn.classList.add("active");
      btn.setAttribute("aria-checked", "true");
      estado.senioridade = btn.dataset.nivel || "pleno";
      achouCorrespondente = true;
    } else {
      btn.classList.remove("active");
      btn.setAttribute("aria-checked", "false");
    }
  });

  if (!achouCorrespondente) {
    estado.senioridade = "personalizado";
  }

  // Recálculo em tempo real se houver uma proposta aberta
  recalcularPropostaAberta();
}

function alternarChip(btnChip) {
  const nomeChip = btnChip.dataset.chip;
  if (!nomeChip) return;

  if (estado.chipsSelecionados.has(nomeChip)) {
    estado.chipsSelecionados.delete(nomeChip);
    btnChip.classList.remove("active");
    btnChip.setAttribute("aria-pressed", "false");
  } else {
    estado.chipsSelecionados.add(nomeChip);
    btnChip.classList.add("active");
    btnChip.setAttribute("aria-pressed", "true");
  }
}

function aplicarPreset(idPreset) {
  const preset = PRESETS_PROJETO[idPreset];
  if (!preset) return;

  limparErroValidacao();

  // 1. Preenche a descrição e atualiza o contador
  if (elementos.descricaoInput) {
    elementos.descricaoInput.value = preset.descricao;
    atualizarContadorCaracteres();
  }

  // 2. Define o valor por hora e senioridade
  definirValorHora(preset.valorHora, true);

  // 3. Atualiza os chips de stack recomendados para o preset
  estado.chipsSelecionados.clear();
  elementos.botoesChips.forEach(btnChip => {
    const nome = btnChip.dataset.chip;
    if (preset.chips.includes(nome)) {
      estado.chipsSelecionados.add(nome);
      btnChip.classList.add("active");
      btnChip.setAttribute("aria-pressed", "true");
    } else {
      btnChip.classList.remove("active");
      btnChip.setAttribute("aria-pressed", "false");
    }
  });

  elementos.descricaoInput?.focus();
}

function atualizarContadorCaracteres() {
  if (!elementos.descricaoInput || !elementos.charCounter) return;
  const tamanho = elementos.descricaoInput.value.length;
  elementos.charCounter.textContent = `${tamanho} / 2000`;
}

/* ==========================================================================
   Recálculo em Tempo Real
   ========================================================================== */
function recalcularPropostaAberta() {
  if (!estado.orcamentoAtual || !elementos.secaoResultado || elementos.secaoResultado.hidden) {
    return;
  }

  const taxaHora = Number(elementos.valorHoraInput?.value) || 100;
  const novoCalculo = calcularOrcamento(
    estado.orcamentoAtual.modulos,
    taxaHora,
    estado.orcamentoAtual.calculo.cotacaoUsdBrl
  );

  estado.orcamentoAtual.calculo = novoCalculo;
  estado.orcamentoAtual.senioridade = estado.senioridade;

  // Atualiza estritamente os campos numéricos da tela
  renderizarMetricasFinanceiras(novoCalculo);

  // Verifica se esta variação já está salva
  atualizarEstadoBotaoSalvar();
}

/* ==========================================================================
   Renderização Segura do Orçamento (DOM Anti-XSS)
   ========================================================================== */
function renderizarMetricasFinanceiras(calculo) {
  if (!calculo) return;

  elementos.resTotalFinalBrl.textContent = formatarBRL(calculo.totalFinalBRL);
  elementos.resTotalFinalUsd.textContent = formatarUSD(calculo.totalFinalUSD);
  elementos.resTotalHoras.textContent = `${calculo.totalHoras} h`;
  elementos.resCustoBase.textContent = formatarBRL(calculo.custoBaseBRL);
  elementos.resDetalheTaxa.textContent = `${calculo.totalHoras}h × ${formatarBRL(calculo.valorHora)}/h`;
  elementos.resMargemSeguranca.textContent = formatarBRL(calculo.margemSegurancaBRL);
}

function atualizarEstadoBotaoSalvar() {
  if (!elementos.btnSalvarOrcamento) return;

  const spanTexto = elementos.btnSalvarOrcamento.querySelector("span:last-child") || elementos.btnSalvarOrcamento;

  if (!estado.orcamentoAtual) {
    elementos.btnSalvarOrcamento.disabled = true;
    spanTexto.textContent = "Salvar no Histórico";
    elementos.btnSalvarOrcamento.classList.remove("btn-saved");
    return;
  }

  const jaSalvo = buscarOrcamentoDuplicado(estado.orcamentoAtual);

  if (jaSalvo) {
    elementos.btnSalvarOrcamento.disabled = true;
    spanTexto.textContent = "Já salvo no histórico";
    elementos.btnSalvarOrcamento.classList.add("btn-saved");
  } else {
    elementos.btnSalvarOrcamento.disabled = false;
    spanTexto.textContent = "Salvar no Histórico";
    elementos.btnSalvarOrcamento.classList.remove("btn-saved");
  }
}

function renderizarProposta(proposta) {
  if (!proposta) return;

  // 1. Cabeçalho da Proposta
  elementos.resNomeProjeto.textContent = proposta.nomeProjeto;
  elementos.resDescricao.textContent = proposta.descricaoResumida;
  elementos.resCotacaoUsd.textContent = formatarCotacao(proposta.calculo.cotacaoUsdBrl);

  // 2. Banner de Contingência (Plano B)
  if (proposta.usouFallback) {
    elementos.bannerFallback.hidden = false;
    elementos.bannerFallbackMotivo.textContent = proposta.motivoFallback ||
      "A API de IA não respondeu ou a chave não foi configurada. Estimativa gerada com segurança pelo motor local de contingência.";
  } else {
    elementos.bannerFallback.hidden = true;
  }

  // 3. Métricas Financeiras
  renderizarMetricasFinanceiras(proposta.calculo);

  // 4. Renderização da Tabela WBS via <template> (Zero innerHTML)
  elementos.listaModulosCorpo.replaceChildren();

  proposta.calculo.modulos.forEach(mod => {
    const clone = elementos.templateModuloLinha.content.cloneNode(true);

    const tdNome = clone.querySelector(".modulo-nome");
    const spanBadge = clone.querySelector(".badge-complexidade");
    const tdHoras = clone.querySelector(".modulo-horas");

    tdNome.textContent = mod.modulo;
    spanBadge.textContent = mod.complexidade;
    tdHoras.textContent = `${mod.horas} h`;

    const compLower = String(mod.complexidade).toLowerCase();
    if (compLower.includes("baixa")) {
      spanBadge.classList.add("badge-complexidade-baixa");
    } else if (compLower.includes("alta")) {
      spanBadge.classList.add("badge-complexidade-alta");
    } else {
      spanBadge.classList.add("badge-complexidade-media");
    }

    elementos.listaModulosCorpo.appendChild(clone);
  });

  // 5. Exibe a seção de resultado e oculta o estado vazio / loading
  elementos.estadoVazio.hidden = true;
  elementos.estadoLoading.hidden = true;
  elementos.secaoResultado.hidden = false;

  // 6. Atualiza o estado do botão de salvar
  atualizarEstadoBotaoSalvar();

  elementos.secaoResultado.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ==========================================================================
   Renderização do Histórico Local
   ========================================================================== */
function formatarDataHora(isoString) {
  try {
    const data = new Date(isoString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(data);
  } catch {
    return "";
  }
}

function renderizarHistorico() {
  const lista = obterHistorico();

  elementos.historicoContador.textContent = String(lista.length);
  elementos.btnLimparHistorico.hidden = lista.length === 0;
  elementos.historicoVazio.hidden = lista.length > 0;

  elementos.historicoLista.replaceChildren();

  if (lista.length === 0) {
    elementos.historicoLista.appendChild(elementos.historicoVazio);
    return;
  }

  lista.forEach(item => {
    const clone = elementos.templateHistoricoItem.content.cloneNode(true);

    const elTitle = clone.querySelector(".history-item-title");
    const elDate = clone.querySelector(".history-item-date");
    const elSummary = clone.querySelector(".history-item-summary");
    const badgeHours = clone.querySelector(".history-badge-hours");
    const badgeBrl = clone.querySelector(".history-badge-brl");
    const badgeUsd = clone.querySelector(".history-badge-usd");
    const btnCarregar = clone.querySelector(".btn-historico-carregar");
    const btnExcluir = clone.querySelector(".btn-historico-excluir");

    elTitle.textContent = item.nomeProjeto;
    elDate.textContent = formatarDataHora(item.dataCriacao);
    elSummary.textContent = item.descricaoResumida;

    const horas = item.calculo?.totalHoras || 0;
    const totalBrl = item.calculo?.totalFinalBRL || 0;
    const totalUsd = item.calculo?.totalFinalUSD || 0;

    badgeHours.textContent = `${horas}h`;
    badgeBrl.textContent = formatarBRL(totalBrl);
    badgeUsd.textContent = formatarUSD(totalUsd);

    btnCarregar.addEventListener("click", () => {
      carregarOrcamentoSalvo(item.id);
    });

    btnExcluir.addEventListener("click", () => {
      removerOrcamento(item.id);
      renderizarHistorico();
      atualizarEstadoBotaoSalvar();
    });

    elementos.historicoLista.appendChild(clone);
  });
}

function carregarOrcamentoSalvo(id) {
  const item = buscarOrcamentoPorId(id);
  if (!item) return;

  estado.orcamentoAtual = {
    id: item.id,
    nomeProjeto: item.nomeProjeto,
    descricaoResumida: item.descricaoResumida,
    modulos: item.calculo.modulos,
    calculo: item.calculo,
    usouFallback: item.usouFallback,
    motivoFallback: "Carregado a partir do histórico local."
  };

  if (elementos.descricaoInput) {
    elementos.descricaoInput.value = item.descricaoResumida;
    atualizarContadorCaracteres();
  }

  definirValorHora(item.calculo.valorHora, true);

  estado.chipsSelecionados.clear();
  elementos.botoesChips.forEach(btnChip => {
    const nome = btnChip.dataset.chip;
    if (Array.isArray(item.chips) && item.chips.includes(nome)) {
      estado.chipsSelecionados.add(nome);
      btnChip.classList.add("active");
      btnChip.setAttribute("aria-pressed", "true");
    } else {
      btnChip.classList.remove("active");
      btnChip.setAttribute("aria-pressed", "false");
    }
  });

  renderizarProposta(estado.orcamentoAtual);
}

/* ==========================================================================
   Validação e Submissão do Formulário
   ========================================================================== */
function validarFormulario() {
  const descricao = (elementos.descricaoInput?.value || "").trim();
  const valorHora = Number(elementos.valorHoraInput?.value);

  if (!Number.isFinite(valorHora) || valorHora < 10 || valorHora > 2000) {
    exibirErroValidacao("Informe um valor por hora válido entre R$ 10 e R$ 2.000.");
    elementos.valorHoraInput?.focus();
    return false;
  }

  if (descricao.length < 8 && estado.chipsSelecionados.size === 0) {
    exibirErroValidacao("Descreva os requisitos do projeto ou selecione ao menos um módulo de stack ou preset rápido.");
    elementos.descricaoInput?.focus();
    return false;
  }

  limparErroValidacao();
  return true;
}

async function processarCalculo(evento) {
  if (evento) evento.preventDefault();

  if (estado.emProcessamento) return;
  if (!validarFormulario()) return;

  estado.emProcessamento = true;

  elementos.btnCalcular.disabled = true;
  elementos.btnCalcularTexto.textContent = "Estimando escopo com IA...";
  atualizarStatusRede("loading", "Processando escopo e câmbio...");

  elementos.estadoVazio.hidden = true;
  elementos.secaoResultado.hidden = true;
  elementos.estadoLoading.hidden = false;

  const descricao = elementos.descricaoInput.value.trim();
  const valorHora = Number(elementos.valorHoraInput.value) || 100;
  const chips = Array.from(estado.chipsSelecionados);

  try {
    // 1. Consulta paralela da IA e Cotação Cambial (com cache de idempotência)
    const resultadoAPI = await consultarEscopoECambio(descricao, chips);

    // 2. Executa cálculo matemático determinístico (+20% de margem)
    const calculo = calcularOrcamento(
      resultadoAPI.escopo.modulos,
      valorHora,
      resultadoAPI.cotacaoUsdBrl
    );

    // 3. Monta o objeto de proposta
    estado.orcamentoAtual = {
      nomeProjeto: resultadoAPI.escopo.nomeProjeto,
      descricaoResumida: resultadoAPI.escopo.descricaoResumida,
      modulos: calculo.modulos,
      calculo,
      usouFallback: resultadoAPI.usouFallbackIA,
      motivoFallback: resultadoAPI.motivoFallback
    };

    // 4. Renderiza resultado (sem salvar automaticamente no histórico, dando controle ao usuário)
    renderizarProposta(estado.orcamentoAtual);

    atualizarStatusRede(
      resultadoAPI.usouFallbackIA ? "error" : "idle",
      resultadoAPI.usouFallbackIA ? "Modo contingência ativo" : "Estimativa gerada com sucesso"
    );

  } catch (erro) {
    console.error("[FreelaScope] Erro inesperado no processamento:", erro);
    atualizarStatusRede("error", "Erro inesperado. Tente novamente.");
    exibirErroValidacao("Ocorreu uma falha inesperada ao processar o cálculo. Tente novamente.");
    elementos.estadoLoading.hidden = true;
    elementos.estadoVazio.hidden = false;
  } finally {
    estado.emProcessamento = false;
    elementos.btnCalcular.disabled = false;
    elementos.btnCalcularTexto.textContent = "Gerar Escopo Técnico (WBS) e Orçamento";
  }
}

/* ==========================================================================
   Inicialização e Event Listeners
   ========================================================================== */
function inicializarEventos() {
  elementos.botoesPreset.forEach(btn => {
    btn.addEventListener("click", () => {
      const idPreset = btn.dataset.template;
      if (idPreset) aplicarPreset(idPreset);
    });
  });

  elementos.botoesSenioridade.forEach(btn => {
    btn.addEventListener("click", () => {
      const valor = btn.dataset.valor;
      if (valor) definirValorHora(valor, true);
    });
  });

  elementos.valorHoraInput?.addEventListener("input", (e) => {
    definirValorHora(e.target.value, false);
  });

  elementos.botoesChips.forEach(btnChip => {
    btnChip.addEventListener("click", () => {
      alternarChip(btnChip);
    });
  });

  elementos.descricaoInput?.addEventListener("input", () => {
    limparErroValidacao();
    atualizarContadorCaracteres();
  });

  elementos.descricaoInput?.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      elementos.form.requestSubmit();
    }
  });

  elementos.form?.addEventListener("submit", processarCalculo);

  // Ação: Salvar no Histórico com Verificação de Duplicatas
  elementos.btnSalvarOrcamento?.addEventListener("click", () => {
    if (!estado.orcamentoAtual) return;

    const registroSalvo = salvarOrcamento({
      nomeProjeto: estado.orcamentoAtual.nomeProjeto,
      descricaoResumida: estado.orcamentoAtual.descricaoResumida,
      senioridade: estado.senioridade,
      chips: Array.from(estado.chipsSelecionados),
      calculo: estado.orcamentoAtual.calculo,
      usouFallback: estado.orcamentoAtual.usouFallback
    });

    if (registroSalvo) {
      estado.orcamentoAtual.id = registroSalvo.id;
    }

    renderizarHistorico();
    atualizarEstadoBotaoSalvar();
  });

  // Ação: Novo Cálculo / Limpar Tela
  elementos.btnNovoCalculo?.addEventListener("click", () => {
    estado.orcamentoAtual = null;
    elementos.secaoResultado.hidden = true;
    elementos.estadoVazio.hidden = false;
    elementos.descricaoInput.value = "";
    atualizarContadorCaracteres();
    limparErroValidacao();
    atualizarEstadoBotaoSalvar();
    elementos.descricaoInput.focus();
  });

  // Ação: Limpar Histórico Completo
  elementos.btnLimparHistorico?.addEventListener("click", () => {
    if (confirm("Tem certeza que deseja apagar todo o histórico de orçamentos?")) {
      limparHistorico();
      renderizarHistorico();
      atualizarEstadoBotaoSalvar();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  inicializarEventos();
  atualizarContadorCaracteres();
  renderizarHistorico();
  atualizarStatusRede("idle", "Sistema pronto");
});
