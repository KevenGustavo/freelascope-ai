/**
 * FreelaScope AI — js/fallback.js
 * Motor de Contingência (Plano B) e Presets de Projeto
 *
 * Atua de forma 100% determinística e offline caso a API externa
 * (Gemini AI ou AwesomeAPI) esteja indisponível, sem chave de API
 * ou com erro de conexão.
 */

/**
 * Cotação comercial padrão de contingência para USD/BRL caso
 * a AwesomeAPI esteja inacessível.
 */
export const COTACAO_USD_FALLBACK = 5.75;

/**
 * Definição dos 3 Presets Rápidos de 1 clique
 */
export const PRESETS_PROJETO = {
  ecommerce: {
    id: "ecommerce",
    titulo: "Plataforma de E-commerce B2C",
    senioridade: "pleno",
    valorHora: 100,
    chips: ["API REST", "Banco de Dados SQL", "Painel Web/Dashboard", "Autenticação/JWT"],
    descricao: "Desenvolvimento de plataforma de e-commerce completa, incluindo catálogo de produtos categorizado, busca textual com filtros, carrinho persistente, checkout seguro integrado a gateway de pagamento (Pix e Cartão de Crédito) e painel administrativo para controle de estoque e pedidos."
  },
  dashboard: {
    id: "dashboard",
    titulo: "Dashboard de Gestão e Telemetria",
    senioridade: "senior",
    valorHora: 180,
    chips: ["API REST", "Banco de Dados SQL", "Painel Web/Dashboard", "Docker/Deploy"],
    descricao: "Painel analítico para consolidação e monitoramento operacional em tempo real. Inclui ingestão de eventos, cálculo de indicadores de desempenho (KPIs), visualização em gráficos analíticos, filtros por período e filial, exportação de relatórios em PDF/CSV e alertas automáticos."
  },
  crud: {
    id: "crud",
    titulo: "Serviço Backend API RESTful",
    senioridade: "pleno",
    valorHora: 100,
    chips: ["API REST", "Banco de Dados SQL", "Autenticação/JWT", "Docker/Deploy"],
    descricao: "Arquitetura backend para serviços corporativos com operações CRUD completas, padronização RESTful, autenticação e autorização via tokens JWT (RBAC), validação defensiva de payloads, migrações de banco relacional e documentação interativa via OpenAPI/Swagger."
  }
};

/**
 * Módulos técnicos mapeados para injeção dinâmica baseada nos chips de stack selecionados
 */
const MODULOS_STACK_CHIPS = {
  "API REST": {
    modulo: "Camada de Serviços e Endpoints API REST",
    horas: 10,
    complexidade: "Média"
  },
  "Banco de Dados SQL": {
    modulo: "Modelagem Relacional, Migrações e Índices SQL",
    horas: 6,
    complexidade: "Média"
  },
  "Painel Web/Dashboard": {
    modulo: "Interface Web Responsiva e Telas de Gestão",
    horas: 12,
    complexidade: "Alta"
  },
  "Autenticação/JWT": {
    modulo: "Segurança, Autenticação JWT e Controle de Acesso (RBAC)",
    horas: 8,
    complexidade: "Média"
  },
  "Docker/Deploy": {
    modulo: "Conteinerização Docker e Pipeline de Implantação CI/CD",
    horas: 6,
    complexidade: "Baixa"
  }
};

/**
 * Gera uma estimativa técnica estruturada de contingência (Plano B)
 * respeitando estritamente o schema exigido da IA.
 *
 * @param {string} descricao Texto digitado pelo usuário ou preset
 * @param {string[]} chipsSelecionados Lista de chips técnicos ativos
 * @returns {{ nomeProjeto: string, descricaoResumida: string, modulos: Array<{ modulo: string, horas: number, complexidade: string }> }}
 */
export function gerarEscopoFallback(descricao = "", chipsSelecionados = []) {
  const textoLimpo = (descricao || "").trim().toLowerCase();
  const chips = Array.isArray(chipsSelecionados) ? chipsSelecionados : [];

  let nomeProjeto = "Sistema Web Sob Medida";
  let descricaoResumida = "Arquitetura modular em camadas orientada aos requisitos técnicos informados.";
  let modulosBase = [];

  // 1. Identificação contextual por palavras-chave ou presets
  if (textoLimpo.includes("commerce") || textoLimpo.includes("loja") || textoLimpo.includes("carrinho") || textoLimpo.includes("pagamento")) {
    nomeProjeto = "Plataforma de E-commerce e Checkout";
    descricaoResumida = "Arquitetura com catálogo de produtos, controle de sessão de compras, checkout transacional e integração financeira.";
    modulosBase = [
      { modulo: "Modelagem de Catálogo e Produtos", horas: 8, complexidade: "Média" },
      { modulo: "Fluxo de Carrinho e Checkout Transacional", horas: 12, complexidade: "Alta" },
      { modulo: "Integração de Pagamentos (Pix / Cartão)", horas: 10, complexidade: "Alta" },
      { modulo: "Painel de Administração de Pedidos", horas: 8, complexidade: "Média" }
    ];
  } else if (textoLimpo.includes("dashboard") || textoLimpo.includes("logístic") || textoLimpo.includes("telemetria") || textoLimpo.includes("painel") || textoLimpo.includes("relatório")) {
    nomeProjeto = "Dashboard Analítico e Operacional";
    descricaoResumida = "Sistema para consolidação de métricas, visualização de dados operacionais e relatórios gerenciais.";
    modulosBase = [
      { modulo: "Pipeline de Agregação de Indicadores e KPIs", horas: 8, complexidade: "Média" },
      { modulo: "Interface Analítica e Visualização em Gráficos", horas: 12, complexidade: "Alta" },
      { modulo: "Módulo de Filtros Parametrizados e Exportação", horas: 6, complexidade: "Baixa" },
      { modulo: "Controle de Acessos e Perfis de Gestão", horas: 6, complexidade: "Média" }
    ];
  } else if (textoLimpo.includes("crud") || textoLimpo.includes("api rest") || textoLimpo.includes("backend") || textoLimpo.includes("microsserviço")) {
    nomeProjeto = "API RESTful e Serviços de Backend";
    descricaoResumida = "Serviço de backend em arquitetura limpa com persistência relacional, validação de dados e segurança de endpoints.";
    modulosBase = [
      { modulo: "Estruturação de Camadas e Regras de Negócio", horas: 8, complexidade: "Média" },
      { modulo: "Implementação de Endpoints CRUD e Validações", horas: 10, complexidade: "Média" },
      { modulo: "Autenticação Segura e Políticas de Autorização", horas: 6, complexidade: "Média" },
      { modulo: "Documentação OpenAPI e Testes Automatizados", horas: 6, complexidade: "Baixa" }
    ];
  } else {
    // Escopo geral adaptativo
    const primeiraLinha = (descricao || "").trim().split("\n")[0].slice(0, 40);
    if (primeiraLinha.length >= 5) {
      nomeProjeto = `Sistema: ${primeiraLinha}`;
    }
    descricaoResumida = (descricao && descricao.length > 10)
      ? `Arquitetura sob medida cobrindo o escopo informado: ${descricao.slice(0, 110)}...`
      : "Solução de software estruturada em componentes independentes para garantir escalabilidade e manutenção simples.";

    modulosBase = [
      { modulo: "Especificação Técnica e Arquitetura Base", horas: 6, complexidade: "Baixa" },
      { modulo: "Desenvolvimento do Núcleo de Regras de Negócio", horas: 14, complexidade: "Alta" },
      { modulo: "Camada de Apresentação e Interação", horas: 10, complexidade: "Média" },
      { modulo: "Testes de Integração e Homologação", horas: 6, complexidade: "Média" }
    ];
  }

  // 2. Incorporação dinâmica dos chips de stack selecionados (sem duplicatas)
  const modulosFinais = [...modulosBase];

  for (const chip of chips) {
    const moduloDef = MODULOS_STACK_CHIPS[chip];
    if (!moduloDef) continue;

    const jaExiste = modulosFinais.some(m =>
      m.modulo.toLowerCase().includes(chip.toLowerCase()) ||
      chip.toLowerCase().includes(m.modulo.toLowerCase().split(" ")[0])
    );

    if (!jaExiste) {
      modulosFinais.push({ ...moduloDef });
    }
  }

  return {
    nomeProjeto,
    descricaoResumida,
    modulos: modulosFinais
  };
}

