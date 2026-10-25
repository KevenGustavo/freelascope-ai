/**
 * FreelaScope AI — Modelo Público de Configuração de IA
 *
 * INSTRUÇÕES:
 * 1. Copie este arquivo e renomeie a cópia para "config.js" no mesmo diretório (js/config.js).
 * 2. O arquivo "js/config.js" está listado no .gitignore e nunca será versionado.
 * 3. Defina abaixo a URL do endpoint, o identificador do modelo e a sua chave de API.
 *
 * Caso os campos estejam vazios ou o arquivo config.js não exista,
 * a aplicação acionará automaticamente o motor de contingência local (js/fallback.js).
 */

export const AI_API_URL = "https://api.groq.com/openai/v1/chat/completions";
export const AI_MODEL = "openai/gpt-oss-120b";
export const AI_API_KEY = "";
