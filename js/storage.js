/**
 * FreelaScope AI — js/storage.js
 * Gerenciamento de Persistência Local (localStorage)
 *
 * Armazena e recupera o histórico de orçamentos gerados,
 * garantindo integridade de dados e proteção defensiva contra
 * JSON corrompido ou indisponibilidade de armazenamento no navegador.
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

    // Filtra apenas registros que possuam a estrutura mínima esperada
    return lista.filter(item => item && typeof item === "object" && item.id && item.nomeProjeto);
  } catch (erro) {
    console.warn("[Storage] Falha ao recuperar histórico do localStorage:", erro);
    return [];
  }
}

/**
 * Salva um novo orçamento no topo do histórico (LIFO).
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

  // Se já existir com o mesmo id, remove a ocorrência anterior para atualizar no topo
  const historicoFiltrado = historicoAtual.filter(item => item.id !== novoRegistro.id);

  // Adiciona no topo e respeita o limite máximo de armazenamento
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
 * @returns {boolean} Verdadeiro se a limpeza foi concluída com sucesso
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

