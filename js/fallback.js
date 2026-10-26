/**
 * FreelaScope AI — js/fallback.js
 * Motor de Contingência (Plano B) e Presets de Desenvolvimento Web & Software
 *
 * Atua de forma 100% determinística e offline caso a API externa
 * (IA ou AwesomeAPI) esteja indisponível, sem chave de API
 * ou com erro de conexão.
 */

/**
 * Cotação comercial padrão de contingência para USD/BRL caso
 * a AwesomeAPI esteja inacessível.
 */
export const COTACAO_USD_FALLBACK = 5.75;

/**
 * Definição dos 3 Templates Rápidos de Aplicações Web / Software
 */
export const PRESETS_PROJETO = {
  ecommerce: {
    id: "ecommerce",
    titulo: "Plataforma de E-commerce Web B2C",
    senioridade: "pleno",
    valorHora: 100,
    chips: [
      "Landing Page / UI Responsiva",
      "Painel Web/Dashboard",
      "API REST",
      "Banco de Dados SQL",
      "Autenticação/JWT",
      "Gateway de Pagamento",
      "Upload / Cloud Storage"
    ],
    descricao: "Desenvolvimento de aplicação web de e-commerce completa: vitrine responsiva com busca e filtros, carrinho persistente, checkout transparente integrado a gateway de pagamento (Pix e Cartão via webhook), upload de fotos de produtos em Cloud Storage e painel administrativo de pedidos e estoque."
  },
  dashboard: {
    id: "dashboard",
    titulo: "Sistema SaaS & Dashboard Analítico",
    senioridade: "senior",
    valorHora: 180,
    chips: [
      "Painel Web/Dashboard",
      "API REST",
      "Banco de Dados SQL",
      "NoSQL / Cache Redis",
      "Autenticação/JWT",
      "Tempo Real / WebSockets",
      "Docker/Deploy"
    ],
    descricao: "Aplicação web SaaS com painel analítico (SPA) para monitoramento operacional em tempo real via WebSockets. Inclui agregação de métricas e KPIs com cache Redis, visualização em gráficos interativos, controle de acesso multi-tenant (RBAC), exportação de relatórios CSV/PDF e deploy conteinerizado."
  },
  crud: {
    id: "crud",
    titulo: "Backend & API RESTful Corporativa",
    senioridade: "pleno",
    valorHora: 100,
    chips: [
      "API REST",
      "Banco de Dados SQL",
      "Autenticação/JWT",
      "Mensageria / E-mail & WhatsApp",
      "Testes Automatizados",
      "Docker/Deploy"
    ],
    descricao: "Arquitetura de software backend com API RESTful padronizada em camadas, operações CRUD completas, autenticação JWT e controle de permissões (RBAC), migrations em banco de dados SQL, disparo transacional de notificações por e-mail/WhatsApp, testes automatizados de integração e container Docker."
  }
};

/**
 * Módulos técnicos mapeados para todos os chips de arquitetura, stack e infraestrutura
 */
const MODULOS_STACK_CHIPS = {
  "Landing Page / UI Responsiva": {
    modulo: "Desenvolvimento Frontend e Interface Web Responsiva (HTML/CSS/JS)",
    horas: 10,
    complexidade: "Média"
  },
  "Painel Web/Dashboard": {
    modulo: "Aplicação Web (SPA), Painel Administrativo e Visualização de Dados",
    horas: 14,
    complexidade: "Alta"
  },
  "API REST": {
    modulo: "Arquitetura Backend, Rotas HTTP e Endpoints API RESTful",
    horas: 12,
    complexidade: "Média"
  },
  "Banco de Dados SQL": {
    modulo: "Modelagem Relacional SQL, Migrations, Índices e Queries",
    horas: 8,
    complexidade: "Média"
  },
  "NoSQL / Cache Redis": {
    modulo: "Camada de Cache em Memória (Redis) e Persistência NoSQL",
    horas: 6,
    complexidade: "Média"
  },
  "Autenticação/JWT": {
    modulo: "Segurança, Autenticação JWT/OAuth2 e Controle de Acesso (RBAC)",
    horas: 8,
    complexidade: "Média"
  },
  "Gateway de Pagamento": {
    modulo: "Integração com Gateway de Pagamento (Pix/Stripe) e Webhooks",
    horas: 12,
    complexidade: "Alta"
  },
  "Tempo Real / WebSockets": {
    modulo: "Servidor de Eventos em Tempo Real (WebSockets / Notificações)",
    horas: 10,
    complexidade: "Alta"
  },
  "Upload / Cloud Storage": {
    modulo: "Serviço de Upload de Arquivos e Integração Cloud Storage (S3/R2)",
    horas: 6,
    complexidade: "Baixa"
  },
  "Mensageria / E-mail & WhatsApp": {
    modulo: "Serviço de Mensageria Transacional (E-mail SMTP e API WhatsApp)",
    horas: 8,
    complexidade: "Média"
  },
  "Testes Automatizados": {
    modulo: "Suíte de Testes Unitários, Integração de API e Homologação",
    horas: 8,
    complexidade: "Média"
  },
  "Docker/Deploy": {
    modulo: "Conteinerização Docker, Configuração Cloud e Pipeline CI/CD",
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

  let nomeProjeto = "Aplicação Web Sob Medida";
  let descricaoResumida = "Arquitetura de software modular em camadas orientada aos requisitos técnicos e de negócio informados.";
  let modulosBase = [];

  // 1. Identificação contextual por palavras-chave ou presets
  if (textoLimpo.includes("commerce") || textoLimpo.includes("loja") || textoLimpo.includes("carrinho") || textoLimpo.includes("vitrine")) {
    nomeProjeto = "Plataforma Web de E-commerce e Checkout";
    descricaoResumida = "Aplicação web com catálogo de produtos, gestão de carrinho, checkout transacional e painel administrativo.";
    modulosBase = [
      { modulo: "Modelagem de Catálogo, Produtos e Estoque", horas: 8, complexidade: "Média" },
      { modulo: "Fluxo de Carrinho e Checkout Transacional", horas: 12, complexidade: "Alta" }
    ];
  } else if (textoLimpo.includes("dashboard") || textoLimpo.includes("saas") || textoLimpo.includes("telemetria") || textoLimpo.includes("painel") || textoLimpo.includes("relatório")) {
    nomeProjeto = "Sistema Web SaaS e Dashboard Analítico";
    descricaoResumida = "Aplicação web para consolidação de indicadores operacionais, visualização de métricas e gestão multi-usuário.";
    modulosBase = [
      { modulo: "Motor de Agregação de Indicadores e Regras de Negócio", horas: 10, complexidade: "Média" },
      { modulo: "Módulo de Filtros Avançados e Exportação de Relatórios", horas: 8, complexidade: "Média" }
    ];
  } else if (textoLimpo.includes("crud") || textoLimpo.includes("api rest") || textoLimpo.includes("backend") || textoLimpo.includes("microsserviço")) {
    nomeProjeto = "Serviço Backend e API RESTful";
    descricaoResumida = "Arquitetura de software backend com persistência relacional, validação de payloads e documentação OpenAPI.";
    modulosBase = [
      { modulo: "Estruturação de Camadas, Domínio e Regras de Negócio", horas: 10, complexidade: "Média" },
      { modulo: "Documentação Técnica OpenAPI/Swagger e Padronização de Erros", horas: 4, complexidade: "Baixa" }
    ];
  } else {
    const primeiraLinha = (descricao || "").trim().split("\n")[0].slice(0, 45);
    if (primeiraLinha.length >= 5) {
      nomeProjeto = `Sistema Web: ${primeiraLinha}`;
    }
    descricaoResumida = (descricao && descricao.length > 10)
      ? `Arquitetura de software sob medida para o escopo: ${descricao.slice(0, 115)}...`
      : "Aplicação web estruturada em camadas desacopladas (Frontend, Backend API e Persistência) com foco em manutenibilidade.";

    modulosBase = [
      { modulo: "Arquitetura de Software e Configuração do Ambiente", horas: 6, complexidade: "Baixa" },
      { modulo: "Desenvolvimento do Núcleo de Regras de Negócio", horas: 14, complexidade: "Alta" }
    ];
  }

  // 2. Incorporação dinâmica de todos os chips de stack selecionados pelo desenvolvedor
  const modulosFinais = [...modulosBase];

  for (const chip of chips) {
    const moduloDef = MODULOS_STACK_CHIPS[chip];
    if (!moduloDef) continue;

    const jaExiste = modulosFinais.some(m => m.modulo === moduloDef.modulo);
    if (!jaExiste) {
      modulosFinais.push({ ...moduloDef });
    }
  }

  // Caso nenhum chip tenha sido selecionado, adiciona entregáveis essenciais de um projeto web
  if (modulosFinais.length < 4) {
    modulosFinais.push(
      { modulo: "Interface Web Responsiva e Componentes de UI", horas: 10, complexidade: "Média" },
      { modulo: "Modelagem de Dados e Integração com API", horas: 8, complexidade: "Média" },
      { modulo: "Testes de Homologação e Deploy em Produção", horas: 6, complexidade: "Baixa" }
    );
  }

  return {
    nomeProjeto,
    descricaoResumida,
    modulos: modulosFinais
  };
}
