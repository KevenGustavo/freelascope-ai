/**
 * FreelaScope AI — js/storage.js
 * Gerenciamento de Persistência Local (localStorage)
 *
 * Armazena e recupera o histórico de orçamentos gerados,
 * garantindo integridade de dados, deduplicação canônica e proteção defensiva
 * contra JSON corrompido ou indisponibilidade de armazenamento no navegador.
 */

const STORAGE_KEY = "freelascope_historico_v1";
const LIMITE_MAX_HISTORICO = 25;

/**
 * Gera um identificador único para o orçamento.
 * Utiliza crypto.randomUUID() nativo ou fallback baseado em timestamp e aleatoriedade.
 *
 * @returns {string}
 */
function gerarIdUnico() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `orc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Gera uma assinatura canônica determinística para um orçamento.
 * Usada para detectar duplicatas mesmo se o ID for diferente.
 *
 * @param {Object} dados
 * @returns {string}
 */
export function gerarAssinaturaOrcamento(dados) {
  if (!dados || typeof dados !== "object") return "";

  const nome = String(dados.nomeProjeto || "").trim().toLowerCase();
  const valorHora = Number(dados?.calculo?.valorHora || dados?.valorHora || 0);
  const totalHoras = Number(dados?.calculo?.totalHoras || dados?.totalHoras || 0);
  const totalFinalBRL = Number(dados?.calculo?.totalFinalBRL || dados?.totalFinalBRL || 0);

  const modulos = Array.isArray(dados?.calculo?.modulos)
    ? dados.calculo.modulos
    : (Array.isArray(dados?.modulos) ? dados.modulos : []);

  const modulosSig = modulos
    .map(m => `${String(m.modulo || "").trim().toLowerCase()}:${Number(m.horas || 0)}`)
    .sort()
    .join(";");

  return `${nome}|${valorHora}|${totalHoras}|${totalFinalBRL}|${modulosSig}`;
}

/**
 * Verifica se uma estimativa já está persistida no histórico (por ID ou assinatura canônica).
 *
 * @param {Object} dados
 * @returns {Object|null} Retorna o registro existente caso encontrado, ou null
 */
export function buscarOrcamentoDuplicado(dados) {
  if (!dados || typeof dados !== "object") return null;

  const historico = obterHistorico();

  // 1. Verificação por ID
  if (dados.id) {
    const porId = historico.find(item => item.id === dados.id);
    if (porId) return porId;
  }

  // 2. Verificação por assinatura canônica
  const assinaturaAlvo = gerarAssinaturaOrcamento(dados);
  if (!assinaturaAlvo) return null;

  return historico.find(item => gerarAssinaturaOrcamento(item) === assinaturaAlvo) || null;
}

/**
 * Obtém a lista completa de orçamentos salvos no localStorage.
 * Retorna sempre um Array (vazio em caso de erro ou ausência de dados).
 *
 * @returns {Array<Object>}
 */
export function obterHistorico() {
  try {
    if (typeof localStorage === "undefined") return [];

    const dadosRaw = localStorage.getItem(STORAGE_KEY);
    if (!dadosRaw) return [];

    const lista = JSON.parse(dadosRaw);
    if (!Array.isArray(lista)) return [];

    return lista.filter(item => item && typeof item === "object" && item.id && item.nomeProjeto);
  } catch (erro) {
    console.warn("[Storage] Falha ao recuperar histórico do localStorage:", erro);
    return [];
  }
}

/**
 * Salva um novo orçamento no topo do histórico (LIFO) com verificação de duplicatas.
 * Caso a estimativa já exista no histórico, retorna o registro já salvo sem duplicar.
 *
 * @param {Object} dados
 * @param {string} dados.nomeProjeto
 * @param {string} dados.descricaoResumida
 * @param {string} [dados.senioridade]
 * @param {Array<string>} [dados.chips]
 * @param {Object} dados.calculo
 * @param {boolean} [dados.usouFallback]
 * @returns {Object|null} Registro persistido ou null em caso de erro
 */
export function salvarOrcamento(dados) {
  if (!dados || typeof dados !== "object" || !dados.nomeProjeto) {
    console.error("[Storage] Dados inválidos fornecidos para salvarOrcamento");
    return null;
  }

  // Bloqueio de duplicatas: se já existir com a mesma assinatura ou ID, retorna o existente
  const existente = buscarOrcamentoDuplicado(dados);
  if (existente) {
    return existente;
  }

  const historicoAtual = obterHistorico();

  const novoRegistro = {
    id: dados.id || gerarIdUnico(),
    dataCriacao: dados.dataCriacao || new Date().toISOString(),
    nomeProjeto: String(dados.nomeProjeto).trim(),
    descricaoResumida: String(dados.descricaoResumida || "").trim(),
    senioridade: dados.senioridade || "pleno",
    chips: Array.isArray(dados.chips) ? [...dados.chips] : [],
    calculo: dados.calculo || null,
    usouFallback: Boolean(dados.usouFallback)
  };

  const historicoFiltrado = historicoAtual.filter(item => item.id !== novoRegistro.id);
  const novoHistorico = [novoRegistro, ...historicoFiltrado].slice(0, LIMITE_MAX_HISTORICO);

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novoHistorico));
    }
    return novoRegistro;
  } catch (erro) {
    console.error("[Storage] Falha ao gravar no localStorage (cota excedida ou restrição):", erro);
    return null;
  }
}

/**
 * Localiza um orçamento específico pelo seu ID.
 *
 * @param {string} id
 * @returns {Object|null}
 */
export function buscarOrcamentoPorId(id) {
  if (!id) return null;
  const historico = obterHistorico();
  return historico.find(item => item.id === id) || null;
}

/**
 * Remove um orçamento do histórico pelo seu ID.
 *
 * @param {string} id
 * @returns {Array<Object>} Lista atualizada de orçamentos
 */
export function removerOrcamento(id) {
  if (!id) return obterHistorico();

  const historicoAtual = obterHistorico();
  const novoHistorico = historicoAtual.filter(item => item.id !== id);

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novoHistorico));
    }
  } catch (erro) {
    console.error("[Storage] Falha ao atualizar localStorage após remoção:", erro);
  }

  return novoHistorico;
}

/**
 * Remove completamente todo o histórico de orçamentos salvos.
 *
 * @returns {boolean}
 */
export function limparHistorico() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    return true;
  } catch (erro) {
    console.error("[Storage] Falha ao limpar histórico do localStorage:", erro);
    return false;
  }
}
