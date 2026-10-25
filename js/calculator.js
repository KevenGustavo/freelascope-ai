/**
 * FreelaScope AI — js/calculator.js
 * Motor Matemático Determinístico e Formatadores Financeiros
 *
 * Responsável exclusivo por todas as operações aritméticas do orçamento:
 * soma de horas inteiras, multiplicação pelo valor/hora, aplicação da
 * margem de segurança de +20% e conversão cambial USD-BRL.
 */

export const MARGEM_SEGURANCA_PERCENTUAL = 0.20; // +20% obrigatório pela especificação

/**
 * Arredonda valores monetários com precisão para 2 casas decimais,
 * evitando erros comuns de ponto flutuante do JavaScript.
 *
 * @param {number} valor
 * @returns {number}
 */
export function arredondarMoeda(valor) {
  const num = Number(valor);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Sanitiza e normaliza a lista de módulos (WBS)
 * garantindo que horas sejam inteiros positivos e complexidade seja válida.
 *
 * @param {Array} modulos
 * @returns {Array<{ modulo: string, horas: number, complexidade: string }>}
 */
export function sanitizarModulos(modulos) {
  if (!Array.isArray(modulos) || modulos.length === 0) {
    return [
      { modulo: "Desenvolvimento do Sistema", horas: 10, complexidade: "Média" }
    ];
  }

  const complexidadesValidas = ["Baixa", "Média", "Alta"];

  return modulos.map((item, index) => {
    const nomeLimpo = (item && typeof item.modulo === "string" && item.modulo.trim())
      ? item.modulo.trim()
      : `Módulo ${index + 1}`;

    const horasBrutas = item && item.horas !== undefined ? Number(item.horas) : 4;
    const horasInteiras = Number.isFinite(horasBrutas) ? Math.max(1, Math.round(horasBrutas)) : 4;

    let complexidade = (item && typeof item.complexidade === "string") ? item.complexidade.trim() : "Média";
    if (!complexidadesValidas.includes(complexidade)) {
      complexidade = "Média";
    }

    return {
      modulo: nomeLimpo,
      horas: horasInteiras,
      complexidade
    };
  });
}

/**
 * Executa o cálculo determinístico completo do orçamento de software.
 *
 * @param {Array} modulosBrutos Lista de módulos (da IA ou do fallback)
 * @param {number} valorHora Taxa horária em Reais (R$)
 * @param {number} cotacaoUsdBrl Cotação da moeda americana (USD -> BRL)
 * @returns {{
 *   modulos: Array<{ modulo: string, horas: number, complexidade: string }>,
 *   totalHoras: number,
 *   valorHora: number,
 *   cotacaoUsdBrl: number,
 *   custoBaseBRL: number,
 *   margemSegurancaBRL: number,
 *   totalFinalBRL: number,
 *   totalFinalUSD: number
 * }}
 */
export function calcularOrcamento(modulosBrutos, valorHora = 100, cotacaoUsdBrl = 5.75) {
  const modulos = sanitizarModulos(modulosBrutos);

  // Normalização e validação das entradas
  const taxaHora = Math.max(1, Number(valorHora) || 100);
  const cotacao = Math.max(0.01, Number(cotacaoUsdBrl) || 5.75);

  // 1. Soma inteira das horas de todos os módulos
  const totalHoras = modulos.reduce((acumulador, item) => acumulador + item.horas, 0);

  // 2. Custo base: horas × taxa horária
  const custoBaseBRL = arredondarMoeda(totalHoras * taxaHora);

  // 3. Margem de segurança contratual de +20%
  const margemSegurancaBRL = arredondarMoeda(custoBaseBRL * MARGEM_SEGURANCA_PERCENTUAL);

  // 4. Investimento final em Reais
  const totalFinalBRL = arredondarMoeda(custoBaseBRL + margemSegurancaBRL);

  // 5. Conversão para Dólar comercial
  const totalFinalUSD = arredondarMoeda(totalFinalBRL / cotacao);

  return {
    modulos,
    totalHoras,
    valorHora: taxaHora,
    cotacaoUsdBrl: cotacao,
    custoBaseBRL,
    margemSegurancaBRL,
    totalFinalBRL,
    totalFinalUSD
  };
}

/**
 * Formatador para moeda brasileira (BRL)
 * @param {number} valor
 * @returns {string} ex: "R$ 3.600,00"
 */
export function formatarBRL(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(valor) || 0);
}

/**
 * Formatador para moeda americana (USD)
 * @param {number} valor
 * @returns {string} ex: "US$ 626.09"
 */
export function formatarUSD(valor) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Number(valor) || 0);
}

/**
 * Formatador para exibição da cotação do câmbio com prefixo R$
 * @param {number} valor
 * @returns {string} ex: "R$ 5,75"
 */
export function formatarCotacao(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(Number(valor) || 0);
}

