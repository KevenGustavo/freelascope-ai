/**
 * FreelaScope AI — js/api.js
 * Camada de Comunicação Externa: API de IA Parametrizada e Cotação Cambial (AwesomeAPI)
 *
 * Características Arquiteturais:
 * 1. Parametrização Externa: Toda configuração da IA (AI_API_URL, AI_MODEL, AI_API_KEY) é lida de js/config.js.
 * 2. Carregamento Dinâmico: 'config.js' importado via try/catch, sem quebrar caso o arquivo não exista.
 * 3. Saída JSON Estruturada: Solicita e valida retorno estritamente no schema WBS do projeto.
 * 4. Resiliência Total: Aciona automaticamente js/fallback.js em caso de erro, timeout ou configuração ausente.
 * 5. Execução Paralela: Consulta simultânea da API de IA e da API de câmbio via Promise.all.
 */

import { COTACAO_USD_FALLBACK, gerarEscopoFallback } from "./fallback.js";

const EXCHANGE_API_URL = "https://economia.awesomeapi.com.br/json/last/USD-BRL";
const TIMEOUT_PADRAO_MS = 15000;

/**
 * Obtém de forma defensiva as configurações de conexão da IA definidas em js/config.js.
 * Caso o arquivo não exista ou falte algum parâmetro obrigatório, retorna null.
 *
 * @returns {Promise<{ apiUrl: string, model: string, apiKey: string } | null>}
 */
export async function obterConfiguracaoIA() {
  try {
    const config = await import("./config.js");
    const apiUrl = typeof config?.AI_API_URL === "string" ? config.AI_API_URL.trim() : "";
    const model = typeof config?.AI_MODEL === "string" ? config.AI_MODEL.trim() : "";
    const apiKey = typeof config?.AI_API_KEY === "string" ? config.AI_API_KEY.trim() : "";

    if (apiUrl && model && apiKey && apiKey.length >= 8) {
      return { apiUrl, model, apiKey };
    }
  } catch {
    // config.js ausente no repositório (comportamento esperado em clones limpos do Git)
  }
  return null;
}

/**
 * Executa uma requisição fetch com timeout gerenciado por AbortController.
 *
 * @param {string} url
 * @param {RequestInit} opcoes
 * @param {number} [timeoutMs]
 * @returns {Promise<Response>}
 */
async function fetchComTimeout(url, opcoes = {}, timeoutMs = TIMEOUT_PADRAO_MS) {
  const controller = new AbortController();
  const idTimer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...opcoes,
      signal: controller.signal
    });
  } finally {
    clearTimeout(idTimer);
  }
}

/**
 * Consulta a AwesomeAPI para obter a cotação comercial atual de USD para BRL.
 * Em caso de falha de rede ou dados inválidos, retorna a cotação de contingência.
 *
 * @returns {Promise<{ cotacao: number, usouFallback: boolean }>}
 */
export async function buscarCotacaoUSD() {
  try {
    const resposta = await fetchComTimeout(EXCHANGE_API_URL, {
      method: "GET",
      headers: { "Accept": "application/json" }
    }, 6000);

    if (!resposta.ok) {
      throw new Error(`AwesomeAPI respondeu com status HTTP ${resposta.status}`);
    }

    const dados = await resposta.json();
    const bid = Number(dados?.USDBRL?.bid);

    if (!Number.isFinite(bid) || bid <= 0) {
      throw new Error("AwesomeAPI retornou valor de cotação inválido");
    }

    return {
      cotacao: Math.round((bid + Number.EPSILON) * 100) / 100,
      usouFallback: false
    };
  } catch (erro) {
    console.warn("[API Câmbio] Falha ao consultar cotação. Ativando valor de contingência:", erro.message);
    return {
      cotacao: COTACAO_USD_FALLBACK,
      usouFallback: true
    };
  }
}

/**
 * Decompõe o projeto em módulos técnicos utilizando o endpoint e modelo definidos em js/config.js.
 * Em caso de configuração ausente, erro de requisição ou timeout, aciona o fallback.js automaticamente.
 *
 * @param {string} descricao Texto de descrição do projeto
 * @param {Array<string>} [chipsSelecionados] Lista de módulos da stack selecionados
 * @returns {Promise<{
 *   escopo: { nomeProjeto: string, descricaoResumida: string, modulos: Array<{ modulo: string, horas: number, complexidade: string }> },
 *   usouFallback: boolean,
 *   motivoFallback: string | null
 * }>}
 */
export async function consultarEscopoIA(descricao, chipsSelecionados = []) {
  const chips = Array.isArray(chipsSelecionados) ? chipsSelecionados : [];
  const textoDescricao = (descricao || "").trim();

  // 1. Carrega a configuração parametrizada pelo usuário em js/config.js
  const configIA = await obterConfiguracaoIA();
  if (!configIA) {
    return {
      escopo: gerarEscopoFallback(textoDescricao, chips),
      usouFallback: true,
      motivoFallback: "Configuração da API de IA (AI_API_URL, AI_MODEL, AI_API_KEY) ausente ou incompleta em js/config.js."
    };
  }

  // 2. Monta as instruções de sistema e o prompt com contrato JSON explícito
  const chipsInfo = chips.length > 0
    ? `\nMódulos de infraestrutura e stack obrigatórios selecionados pelo usuário: ${chips.join(", ")}.`
    : "";

  const promptUsuario = `Analise a seguinte especificação de software e decomponha o sistema em módulos técnicos da Estrutura Analítica do Projeto (WBS) com horas inteiras estimadas:${chipsInfo}\n\nEspecificação do Projeto:\n${textoDescricao}`;

  const systemInstruction = `Você é um Engenheiro de Software Sênior e Arquiteto de Soluções especialista em estimativa de projetos de software.
Sua única responsabilidade é decompor o projeto em módulos técnicos realistas (WBS) e responder EXCLUSIVAMENTE um objeto JSON válido em português do Brasil seguindo exatamente este schema:
{
  "nomeProjeto": "Nome formal e conciso do sistema",
  "descricaoResumida": "Resumo técnico da arquitetura recomendada em até 2 frases",
  "modulos": [
    { "modulo": "Nome do módulo técnico", "horas": 8, "complexidade": "Baixa" | "Média" | "Alta" }
  ]
}
Regras obrigatórias:
1. O campo 'horas' deve ser um número inteiro positivo calibrado para o esforço realista de um desenvolvedor freelancer individual (tipicamente entre 4 e 24 horas por módulo).
2. O campo 'complexidade' deve ser estritamente um destes valores: "Baixa", "Média" ou "Alta".
3. Inclua entre 4 e 7 módulos cobrindo os requisitos e os chips de stack selecionados.
4. Nunca calcule preços monetários; retorne apenas o objeto JSON puro.`;

  const payload = {
    model: configIA.model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: promptUsuario }
    ]
  };

  try {
    const resposta = await fetchComTimeout(configIA.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${configIA.apiKey}`
      },
      body: JSON.stringify(payload)
    }, TIMEOUT_PADRAO_MS);

    if (!resposta.ok) {
      let detalhe = `HTTP ${resposta.status}`;
      try {
        const erroJson = await resposta.json();
        if (erroJson?.error?.message) {
          detalhe += `: ${erroJson.error.message}`;
        }
      } catch {
        // Ignora erro de parse secundário
      }
      throw new Error(`Falha na API de IA (${detalhe})`);
    }

    const dados = await resposta.json();
    const conteudoTexto = dados?.choices?.[0]?.message?.content;

    if (!conteudoTexto) {
      throw new Error("A API de IA não retornou conteúdo JSON válido.");
    }

    const escopoGerado = JSON.parse(conteudoTexto);

    if (!escopoGerado || !escopoGerado.nomeProjeto || !Array.isArray(escopoGerado.modulos) || escopoGerado.modulos.length === 0) {
      throw new Error("O JSON retornado pela IA não seguiu o schema esperado.");
    }

    return {
      escopo: escopoGerado,
      usouFallback: false,
      motivoFallback: null
    };
  } catch (erro) {
    const mensagemSegura = (erro?.message || "Erro desconhecido").replace(configIA.apiKey, "[REDACTED_API_KEY]");
    console.warn("[API IA] Contingência acionada. Motivo:", mensagemSegura);

    return {
      escopo: gerarEscopoFallback(textoDescricao, chips),
      usouFallback: true,
      motivoFallback: `Falha na comunicação com a API de IA (${mensagemSegura}). Escopo gerado pelo motor local.`
    };
  }
}

/**
 * Orquestra as consultas paralelas à API de IA e à AwesomeAPI de câmbio.
 * Executa ambas simultaneamente com Promise.all.
 *
 * @param {string} descricao
 * @param {Array<string>} [chipsSelecionados]
 * @returns {Promise<{
 *   escopo: { nomeProjeto: string, descricaoResumida: string, modulos: Array<{ modulo: string, horas: number, complexidade: string }> },
 *   cotacaoUsdBrl: number,
 *   usouFallbackIA: boolean,
 *   usouFallbackCambio: boolean,
 *   motivoFallback: string | null
 * }>}
 */
export async function consultarEscopoECambio(descricao, chipsSelecionados = []) {
  const [resultadoIA, resultadoCambio] = await Promise.all([
    consultarEscopoIA(descricao, chipsSelecionados),
    buscarCotacaoUSD()
  ]);

  return {
    escopo: resultadoIA.escopo,
    cotacaoUsdBrl: resultadoCambio.cotacao,
    usouFallbackIA: resultadoIA.usouFallback,
    usouFallbackCambio: resultadoCambio.usouFallback,
    motivoFallback: resultadoIA.motivoFallback
  };
}
