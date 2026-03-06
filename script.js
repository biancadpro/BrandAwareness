/* ============================================================
   BUILD YOUR BRAND — script.js
   Mini Game de Brand Awareness
   ============================================================ */

'use strict';

// ─── CONFIGURAÇÃO DO JOGO ──────────────────────────────────────
// Cada pergunta tem: id, texto e opções.
// Cada opção tem: texto, score (0|10|20), e opcionalmente "swatch" (cor CSS para Q3).
// Q5 é dinâmica — suas opções são definidas por segmento (ver TOUCHPOINTS_BY_SEGMENT).
// Para alterar perguntas ou pesos, edite apenas estas constantes.

const LETTERS = ['A', 'B', 'C', 'D'];

// Duração (ms) das transições de tela. Deve coincidir com o transition no CSS.
const SCREEN_TRANSITION_MS = 460;

// Mapeamento de essência → paleta mais coerente (usado na lógica de Q3)
// {essenciaIndex: {paletaIndex: score}}
// Índices de essência: 0=Confiança, 1=Criatividade, 2=Diversão, 3=Exclusividade
// Índices de paleta:   0=Azul/ciano, 1=Rosa/magenta, 2=Verde/turquesa, 3=Dourado/roxo
const COLOR_COHERENCE = {
  0: { 0: 20, 1: 0,  2: 10, 3: 0  },  // Confiança
  1: { 0: 0,  1: 20, 2: 0,  3: 10 },  // Criatividade
  2: { 0: 0,  1: 20, 2: 10, 3: 0  },  // Diversão
  3: { 0: 10, 1: 0,  2: 0,  3: 20 },  // Exclusividade
};

// Pontos de contato ideais por segmento (índice da resposta correta ou parcial)
// {segmentoIndex: [{texto, score}]}
const TOUCHPOINTS_BY_SEGMENT = {
  0: [ // Streaming infantil
    { text: 'Plataformas de vídeo e redes sociais (YouTube, Instagram, TikTok)', score: 20 },
    { text: 'Ativações em eventos infantis e parcerias com escolas',              score: 10 },
    { text: 'Outdoor isolado sem continuidade digital',                           score: 0  },
    { text: 'E-mail marketing sem segmentação de público',                        score: 0  },
  ],
  1: [ // Parque temático
    { text: 'Experiências presenciais imersivas + redes sociais compartilháveis', score: 20 },
    { text: 'Influenciadores de viagem e família',                                score: 10 },
    { text: 'E-mail frio para lista geral sem interesse declarado',               score: 0  },
    { text: 'Folheto impresso sem distribuição estratégica',                      score: 0  },
  ],
  2: [ // Marca de moda urbana
    { text: 'Instagram, TikTok e parcerias com influenciadores de moda',         score: 20 },
    { text: 'Pop-ups físicos em regiões de alto trânsito urbano',                score: 10 },
    { text: 'Outdoor isolado sem link com redes sociais',                         score: 0  },
    { text: 'E-mail frio sem segmentação de estilo',                              score: 0  },
  ],
  3: [ // Aplicativo financeiro
    { text: 'Conteúdo educacional financeiro + app stores + LinkedIn',           score: 20 },
    { text: 'Parcerias B2B com contadores e consultorias',                        score: 10 },
    { text: 'Outdoor genérico sem segmentação de perfil financeiro',              score: 0  },
    { text: 'Folheto impresso em agências bancárias sem call-to-action digital',  score: 0  },
  ],
};

// Perguntas fixas (Q1–Q4). Q5 é gerada dinamicamente no início de cada rodada.
const STATIC_QUESTIONS = [
  {
    id: 1,
    step: 'Pergunta 1 — Segmento da marca',
    text: 'Qual tipo de marca está sendo criado?',
    options: [
      { text: 'Streaming infantil',    score: 20 },
      { text: 'Parque temático',       score: 20 },
      { text: 'Marca de moda urbana',  score: 20 },
      { text: 'Aplicativo financeiro', score: 20 },
    ],
  },
  {
    id: 2,
    step: 'Pergunta 2 — Essência da marca',
    text: 'Qual sensação principal essa marca quer despertar?',
    options: [
      { text: 'Confiança',      score: 20 },
      { text: 'Criatividade',   score: 20 },
      { text: 'Diversão',       score: 20 },
      { text: 'Exclusividade',  score: 20 },
    ],
  },
  {
    id: 3,
    step: 'Pergunta 3 — Identidade visual',
    text: 'Qual paleta visual traduz melhor essa proposta?',
    options: [
      { text: 'Azul / ciano',       swatch: 'linear-gradient(135deg,#00d4ff,#00fff7)', score: null },
      { text: 'Rosa / magenta',     swatch: 'linear-gradient(135deg,#f9a8d4,#f020a0)', score: null },
      { text: 'Verde / turquesa',   swatch: 'linear-gradient(135deg,#34d399,#06b6d4)', score: null },
      { text: 'Dourado / roxo',     swatch: 'linear-gradient(135deg,#fbbf24,#7c3aed)', score: null },
    ],
  },
  {
    id: 4,
    step: 'Pergunta 4 — Estratégia de awareness',
    text: 'Qual ação faria essa marca ser mais lembrada?',
    options: [
      { text: 'Repetição visual consistente em vários pontos de contato',     score: 20 },
      { text: 'Campanha polêmica sem coerência com a identidade da marca',    score: 0  },
      { text: 'Mudança constante de logo e slogan para "parecer atual"',      score: 0  },
      { text: 'Comunicação genérica sem identidade visual definida',          score: 0  },
    ],
  },
];

// ─── ESTADO DO JOGO ───────────────────────────────────────────
let questions      = [];    // Perguntas desta rodada (Q1–Q4 + Q5 dinâmica)
let currentIndex   = 0;     // Índice da pergunta atual (0–4)
let totalScore     = 0;     // Pontuação acumulada
let answers        = [];    // {questionId, optionIndex, score} para cada resposta
let segmentChoice  = 0;     // Índice de segmento escolhido em Q1
let essenceChoice  = 0;     // Índice de essência escolhida em Q2

// ─── REFERÊNCIAS AO DOM ───────────────────────────────────────
const screens = {
  start:  document.getElementById('screen-start'),
  game:   document.getElementById('screen-game'),
  result: document.getElementById('screen-result'),
};

const elCounter     = document.getElementById('question-counter');
const elProgressFill= document.getElementById('progress-fill');
const elStepTag     = document.getElementById('step-tag');
const elQuestionText= document.getElementById('question-text');
const elOptionsGrid = document.getElementById('options-grid');

const elResultLevel = document.getElementById('result-level');
const elScoreValue  = document.getElementById('score-value');
const elRingProgress= document.getElementById('ring-progress');
const elFeedbackBox = document.getElementById('feedback-box');
const pyramidLevels = document.querySelectorAll('.pyramid-level');

// ─── UTILITÁRIOS DE TELA ──────────────────────────────────────

/**
 * Transiciona de uma tela para outra com fade + slide.
 * @param {string} from - ID da tela atual (sem '#')
 * @param {string} to   - ID da tela de destino (sem '#')
 */
function showScreen(from, to) {
  const fromEl = screens[from];
  const toEl   = screens[to];

  fromEl.classList.add('exit');
  fromEl.classList.remove('active');

  setTimeout(() => {
    fromEl.classList.remove('exit');
    toEl.classList.add('active');
  }, SCREEN_TRANSITION_MS);
}

// ─── CANVAS DE PARTÍCULAS (TELA INICIAL) ─────────────────────
(function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const PARTICLE_COUNT = 55;
  let W, H, particles;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.6 + 0.4,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Linhas entre partículas próximas
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,212,255,${0.18 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    // Pontos
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,212,255,0.55)';
      ctx.fill();

      // Movimento
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    });

    requestAnimationFrame(draw);
  }

  init();
  draw();
  window.addEventListener('resize', init);
}());

// ─── LÓGICA PRINCIPAL ─────────────────────────────────────────

/** Inicia ou reinicia o jogo. */
function startGame() {
  // Resetar estado
  currentIndex  = 0;
  totalScore    = 0;
  answers       = [];
  segmentChoice = 0;
  essenceChoice = 0;

  // Montar lista de perguntas (Q5 dinâmica será substituída após Q1)
  questions = [...STATIC_QUESTIONS, buildQ5(0)];

  renderQuestion(0);
  showScreen('start', 'game');
}

/** Gera a Pergunta 5 com opções de acordo com o segmento. */
function buildQ5(segmentIndex) {
  const opts = TOUCHPOINTS_BY_SEGMENT[segmentIndex];
  return {
    id: 5,
    step: 'Pergunta 5 — Ponto de contato',
    text: 'Onde essa marca deveria aparecer com mais força para ganhar lembrança?',
    options: opts,
  };
}

/** Renderiza a pergunta de índice `idx` na tela de jogo. */
function renderQuestion(idx) {
  const q = questions[idx];

  // Atualizar indicadores de progresso
  elCounter.textContent      = `${idx + 1} / ${questions.length}`;
  elProgressFill.style.width = `${(idx / questions.length) * 100}%`;
  elStepTag.textContent      = q.step;
  elQuestionText.textContent = q.text;

  // Construir cards de opção
  elOptionsGrid.innerHTML = '';
  q.options.forEach((opt, i) => {
    const card = document.createElement('div');
    card.className   = 'option-card';
    card.dataset.idx = i;

    // Bolinha com letra (ou swatch de cor para Q3)
    if (opt.swatch) {
      const swatch = document.createElement('div');
      swatch.className = 'option-swatch';
      swatch.style.background = opt.swatch;
      card.appendChild(swatch);
    } else {
      const letter = document.createElement('div');
      letter.className   = 'option-letter';
      letter.textContent = LETTERS[i];
      card.appendChild(letter);
    }

    const text = document.createElement('p');
    text.className   = 'option-text';
    text.textContent = opt.text;
    card.appendChild(text);

    card.addEventListener('click', () => handleAnswer(i));
    elOptionsGrid.appendChild(card);
  });
}

/**
 * Trata a seleção de uma opção.
 * @param {number} optionIdx - Índice da opção clicada
 */
function handleAnswer(optionIdx) {
  // Impedir duplo clique
  const cards = elOptionsGrid.querySelectorAll('.option-card');
  cards.forEach(c => c.style.pointerEvents = 'none');

  // Destacar a seleção
  cards[optionIdx].classList.add('selected');

  const q = questions[currentIndex];

  // Calcular score desta pergunta
  let score = computeScore(currentIndex, optionIdx);

  // Guardar resposta
  answers.push({ questionId: q.id, optionIndex: optionIdx, score });
  totalScore += score;

  // Atualizar estado contextual
  if (q.id === 1) {
    segmentChoice = optionIdx;
    // Atualizar Q5 com o segmento correto
    questions[4] = buildQ5(segmentChoice);
  }
  if (q.id === 2) {
    essenceChoice = optionIdx;
  }

  // Avançar após breve pausa para o usuário ver o feedback visual
  setTimeout(() => {
    currentIndex++;
    if (currentIndex < questions.length) {
      renderQuestion(currentIndex);
    } else {
      showResult();
    }
  }, 560);
}

/**
 * Calcula a pontuação para uma resposta.
 * @param {number} qIdx      - Índice da pergunta
 * @param {number} optionIdx - Índice da opção selecionada
 * @returns {number} Pontuação (0, 10 ou 20)
 */
function computeScore(qIdx, optionIdx) {
  const q = questions[qIdx];

  // Q3: score depende da coerência com a essência escolhida (Q2)
  if (q.id === 3) {
    return COLOR_COHERENCE[essenceChoice][optionIdx];
  }

  // Todas as outras perguntas têm score estático na opção
  return q.options[optionIdx].score;
}

// ─── RESULTADO ────────────────────────────────────────────────

/** Exibe a tela de resultado com pontuação, pirâmide e feedback. */
function showResult() {
  // Garantir que todas as 5 respostas foram registradas
  if (answers.length < questions.length) return;

  const score = totalScore;
  const { level, levelKey } = getLevel(score);

  // Nível e pontuação
  elResultLevel.textContent = level;
  elScoreValue.textContent  = score;

  // Animar anel SVG
  // Circunferência do anel (r=50): 2π×50 ≈ 314
  const circumference = 314;
  const offset = circumference - (score / 100) * circumference;
  // Garante que o SVG tenha o gradiente definido
  ensureRingGradient();
  setTimeout(() => {
    elRingProgress.style.strokeDashoffset = offset;
  }, 120);

  // Pirâmide: destacar nível alcançado
  pyramidLevels.forEach(el => {
    el.classList.toggle('active-level', el.dataset.level === levelKey);
  });

  // Feedback personalizado
  elFeedbackBox.innerHTML = buildFeedback(score, levelKey);

  showScreen('game', 'result');

  // Completar a barra de progresso ao entrar na tela de resultado
  elProgressFill.style.width = '100%';
}

/**
 * Retorna o nível de brand awareness baseado na pontuação.
 * @param {number} score
 * @returns {{ level: string, levelKey: string }}
 */
function getLevel(score) {
  if (score >= 80) return { level: 'Top of Mind',  levelKey: 'top-of-mind'  };
  if (score >= 55) return { level: 'Recall',        levelKey: 'recall'        };
  if (score >= 30) return { level: 'Recognition',   levelKey: 'recognition'   };
  return              { level: 'No Awareness',   levelKey: 'no-awareness'  };
}

/**
 * Constrói o HTML de feedback personalizado.
 * @param {number} score
 * @param {string} levelKey
 * @returns {string} HTML do bloco de feedback
 */
function buildFeedback(score, levelKey) {
  // Recuperar detalhes das respostas para feedback granular
  const segmentName  = STATIC_QUESTIONS[0].options[answers[0]?.optionIndex ?? 0].text;
  const essenceName  = STATIC_QUESTIONS[1].options[answers[1]?.optionIndex ?? 0].text;
  const colorScore   = answers[2]?.score ?? 0;
  const stratScore   = answers[3]?.score ?? 0;
  const touchScore   = answers[4]?.score ?? 0;

  const colorCoherent   = colorScore === 20;
  const stratCorrect    = stratScore === 20;
  const touchCorrect    = touchScore === 20;

  // Textos de feedback por nível
  const feedbackTexts = {
    'top-of-mind': `
      Sua marca demonstrou <strong>domínio estratégico completo</strong>. A identidade visual está
      alinhada à essência de <strong>${essenceName}</strong>, a estratégia de exposição é coerente e
      os pontos de contato foram escolhidos com precisão para o segmento
      <strong>${segmentName}</strong>. Essa coerência é o que transforma visibilidade em
      <strong>Top of Mind</strong> — a marca que o público lembra espontaneamente, sem precisar
      de dicas.
    `,
    'recall': `
      Sua marca já ocupa espaço consistente na memória do público. A combinação de
      <strong>${essenceName}</strong> com as escolhas visuais e de canal cria uma identidade
      reconhecível para o segmento <strong>${segmentName}</strong>. Para alcançar
      <strong>Top of Mind</strong>, refine a consistência da estratégia de exposição e amplie
      os pontos de contato mais relevantes para o seu público.
    `,
    'recognition': `
      Sua marca ainda está construindo sua presença. O público consegue reconhecê-la quando a
      vê, mas ainda não a lembra espontaneamente. Para o segmento
      <strong>${segmentName}</strong> com essência de <strong>${essenceName}</strong>, o próximo
      passo é garantir <strong>repetição visual consistente</strong> nos canais certos e fortalecer
      a coerência entre mensagem, paleta e estratégia.
    `,
    'no-awareness': `
      Sua marca ainda não criou uma presença memorável. As escolhas de identidade visual,
      estratégia e pontos de contato precisam ser revisitadas com atenção à coerência entre
      essência (<strong>${essenceName}</strong>) e execução. Releia o capítulo sobre saliência
      estratégica e tente novamente!
    `,
  };

  // Detalhamento por pergunta
  const pillQ3 = colorCoherent
    ? `<span class="score-pill ok">Paleta coerente +${colorScore}</span>`
    : colorScore === 10
      ? `<span class="score-pill warn">Paleta parcial +${colorScore}</span>`
      : `<span class="score-pill fail">Paleta incoerente +0</span>`;

  const pillQ4 = stratCorrect
    ? `<span class="score-pill ok">Estratégia correta +20</span>`
    : `<span class="score-pill fail">Estratégia fraca +0</span>`;

  const pillQ5 = touchCorrect
    ? `<span class="score-pill ok">Canal ideal +20</span>`
    : touchScore === 10
      ? `<span class="score-pill warn">Canal parcial +10</span>`
      : `<span class="score-pill fail">Canal inadequado +0</span>`;

  return `
    <p>${feedbackTexts[levelKey]}</p>
    <div class="feedback-score-detail">
      <span class="score-pill ok">Segmento +20</span>
      <span class="score-pill ok">Essência +20</span>
      ${pillQ3}
      ${pillQ4}
      ${pillQ5}
    </div>
  `;
}

/**
 * Injeta o gradiente SVG necessário para o anel de score (uma única vez).
 */
function ensureRingGradient() {
  if (document.getElementById('ring-gradient')) return;
  const svg  = elRingProgress.closest('svg');
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#00d4ff"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  `;
  svg.prepend(defs);
}

// ─── EVENT LISTENERS ──────────────────────────────────────────
document.getElementById('btn-start').addEventListener('click', startGame);

document.getElementById('btn-restart').addEventListener('click', () => {
  showScreen('result', 'start');
  // Pequeno delay para a animação de saída da tela de resultado antes de reiniciar
  setTimeout(startGame, SCREEN_TRANSITION_MS + 20);
});
