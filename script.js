// Build Your Brand - lógica principal
// Arquivo organizado para facilitar manutenção de perguntas, pesos e feedback.

const CHAPTER_URL = "#"; // Troque pelo link real do capítulo quando necessário.
const MAX_POINTS_PER_QUESTION = 20;
const TOTAL_QUESTIONS = 5;

const appState = {
  currentQuestion: 0,
  answers: {
    segment: null,
    essence: null,
    palette: null,
    strategy: null,
    touchpoint: null,
  },
  breakdown: [],
  score: 0,
};

const segmentTouchpoints = {
  "Streaming infantil": [
    "Plataforma de vídeo e redes sociais",
    "Outdoor isolado",
    "E-mail frio",
    "Folheto impresso sem continuidade",
  ],
  "Parque temático": [
    "Vídeos imersivos, redes sociais e app oficial do parque",
    "Anúncio único em jornal local",
    "E-mail sem segmentação",
    "Panfleto genérico sem continuidade",
  ],
  "Marca de moda urbana": [
    "Conteúdo com creators, drops em redes sociais e e-commerce",
    "Outdoor isolado em bairro sem aderência",
    "Newsletter fria sem comunidade",
    "Folheto impresso sem linguagem da marca",
  ],
  "Aplicativo financeiro": [
    "App stores, conteúdo educativo e redes sociais com prova de confiança",
    "Faixa de rua isolada",
    "E-mail frio sem contexto",
    "Folheto sem continuidade digital",
  ],
};

const questions = [
  {
    id: "segment",
    text: "Qual tipo de marca está sendo criado?",
    options: Object.keys(segmentTouchpoints),
    score: () => ({
      points: 10,
      note: "Definir um segmento claro cria foco inicial de awareness.",
    }),
  },
  {
    id: "essence",
    text: "Qual sensação principal essa marca quer despertar?",
    options: ["Confiança", "Criatividade", "Diversão", "Exclusividade"],
    score: () => ({
      points: 10,
      note: "Escolher uma essência reduz ruído e orienta as decisões da marca.",
    }),
  },
  {
    id: "palette",
    text: "Qual paleta visual traduz melhor essa proposta?",
    options: ["Azul / ciano", "Rosa / magenta", "Verde / turquesa", "Dourado / roxo"],
    score: (answer, state) => {
      const essenceToPalette = {
        Confiança: { strong: "Azul / ciano", partial: ["Verde / turquesa"] },
        Criatividade: { strong: "Rosa / magenta", partial: ["Dourado / roxo"] },
        Diversão: { strong: "Rosa / magenta", partial: ["Azul / ciano"] },
        Exclusividade: { strong: "Dourado / roxo", partial: ["Azul / ciano"] },
      };

      const target = essenceToPalette[state.answers.essence];
      if (!target) {
        return {
          points: 0,
          note: "Sem essência definida, a paleta perde direção estratégica.",
        };
      }

      if (answer === target.strong) {
        return {
          points: MAX_POINTS_PER_QUESTION,
          note: "Alta coerência entre emoção da marca e identidade visual.",
        };
      }

      if (target.partial.includes(answer)) {
        return {
          points: 10,
          note: "Há coerência parcial, mas a paleta ainda pode ser mais precisa.",
        };
      }

      return {
        points: 0,
        note: "A paleta escolhida enfraquece a lembrança da mensagem central.",
      };
    },
  },
  {
    id: "strategy",
    text: "Qual ação faria essa marca ser mais lembrada?",
    options: [
      "Repetição visual consistente em vários pontos de contato",
      "Campanha polêmica sem coerência com a marca",
      "Mudança constante de logo e slogan",
      "Comunicação genérica sem identidade visual forte",
    ],
    score: (answer) => {
      if (answer === "Repetição visual consistente em vários pontos de contato") {
        return {
          points: MAX_POINTS_PER_QUESTION,
          note: "Excelente: repetição coerente aumenta reconhecimento e disponibilidade mental.",
        };
      }

      if (answer === "Campanha polêmica sem coerência com a marca") {
        return {
          points: 10,
          note: "Gera atenção no curto prazo, mas prejudica consistência e lembrança qualificada.",
        };
      }

      return {
        points: 0,
        note: "Sem consistência estratégica, a marca aparece, mas não fixa na memória.",
      };
    },
  },
  {
    id: "touchpoint",
    text: "Onde essa marca deveria aparecer com mais força para ganhar lembrança?",
    options: (state) => segmentTouchpoints[state.answers.segment] || [],
    score: (answer, state) => {
      const optionsBySegment = segmentTouchpoints[state.answers.segment] || [];
      const ideal = optionsBySegment[0];
      const partial = optionsBySegment[1];

      if (answer === ideal) {
        return {
          points: MAX_POINTS_PER_QUESTION,
          note: "Canal bem escolhido: forte aderência ao público e à rotina de consumo.",
        };
      }

      if (answer === partial) {
        return {
          points: 10,
          note: "Tem visibilidade, mas pouca continuidade para gerar lembrança consistente.",
        };
      }

      return {
        points: 0,
        note: "Baixa conexão com o público: presença fraca para construir recall.",
      };
    },
  },
];

const startScreen = document.getElementById("startScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");
const startBtn = document.getElementById("startBtn");
const backBtn = document.getElementById("backBtn");
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const progressBar = document.getElementById("progressBar");
const progressLabel = document.getElementById("progressLabel");
const progressPercent = document.getElementById("progressPercent");
const resultTitle = document.getElementById("resultTitle");
const resultScore = document.getElementById("resultScore");
const resultFeedback = document.getElementById("resultFeedback");
const restartBtn = document.getElementById("restartBtn");
const explainBtn = document.getElementById("explainBtn");
const explanationBox = document.getElementById("explanationBox");
const explanationList = document.getElementById("explanationList");
const chapterBtn = document.getElementById("chapterBtn");

chapterBtn.href = CHAPTER_URL;

function showScreen(screen) {
  [startScreen, quizScreen, resultScreen].forEach((s) => s.classList.remove("active"));
  screen.classList.add("active");
}

function getCurrentQuestion() {
  return questions[appState.currentQuestion];
}

function resolveOptions(question) {
  return typeof question.options === "function" ? question.options(appState) : question.options;
}

function updateProgress() {
  const index = appState.currentQuestion + 1;
  const percent = Math.round((index / TOTAL_QUESTIONS) * 100);
  progressLabel.textContent = `Pergunta ${index} de ${TOTAL_QUESTIONS}`;
  progressPercent.textContent = `${percent}%`;
  progressBar.style.width = `${percent}%`;
}

function renderQuestion() {
  const question = getCurrentQuestion();
  const options = resolveOptions(question);

  updateProgress();
  questionText.textContent = question.text;
  optionsContainer.innerHTML = "";

  const currentAnswer = appState.answers[question.id];

  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-btn";
    button.textContent = option;

    if (currentAnswer === option) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      appState.answers[question.id] = option;
      nextQuestion();
    });

    optionsContainer.appendChild(button);
  });

  backBtn.disabled = appState.currentQuestion === 0;
}

function nextQuestion() {
  if (appState.currentQuestion < TOTAL_QUESTIONS - 1) {
    appState.currentQuestion += 1;
    renderQuestion();
  } else {
    calculateResult();
    renderResult();
  }
}

function previousQuestion() {
  if (appState.currentQuestion > 0) {
    appState.currentQuestion -= 1;
    renderQuestion();
  }
}

function calculateResult() {
  const breakdown = questions.map((question, idx) => {
    const answer = appState.answers[question.id];
    const scoreResult = question.score(answer, appState);

    return {
      question: idx + 1,
      title: question.text,
      answer,
      points: scoreResult.points,
      note: scoreResult.note,
    };
  });

  const total = breakdown.reduce((sum, item) => sum + item.points, 0);

  appState.breakdown = breakdown;
  appState.score = total;
}

function getLevel(score) {
  if (score <= 29) return "No Awareness";
  if (score <= 54) return "Recognition";
  if (score <= 79) return "Recall";
  return "Top of Mind";
}

function getSmartFeedback(score, level, state) {
  const strongVisual = state.breakdown.find((b) => b.question === 3)?.points === 20;
  const strongStrategy = state.breakdown.find((b) => b.question === 4)?.points === 20;
  const strongTouchpoint = state.breakdown.find((b) => b.question === 5)?.points === 20;

  if (level === "Top of Mind") {
    return "Excelente consistência estratégica. Sua marca uniu essência, identidade visual, repetição e canal certo. Esse conjunto aumenta reconhecimento e impulsiona lembrança espontânea.";
  }

  if (level === "Recall") {
    if (!strongStrategy) {
      return "Sua marca já é lembrada, mas ainda perde força na repetição consistente. Ajustar a estratégia de exposição pode elevar seu nível para Top of Mind.";
    }
    return "Boa evolução: a marca começa a ocupar espaço real na memória do público. Com mais consistência nos pontos de contato, pode chegar ao Top of Mind.";
  }

  if (level === "Recognition") {
    if (!strongVisual) {
      return "Há reconhecimento inicial, mas a identidade visual ainda não traduz bem a mensagem principal. Reforçar coerência entre emoção e paleta melhora a saliência.";
    }
    if (!strongTouchpoint) {
      return "A proposta existe, mas o canal principal ainda não favorece lembrança contínua. Leve a marca para pontos de contato com maior aderência ao público.";
    }
    return "Você construiu base de reconhecimento, porém falta consistência para transformar visibilidade em lembrança espontânea.";
  }

  return "A marca ainda aparece de forma dispersa. Para sair de No Awareness, alinhe essência, identidade visual e repetição nos canais certos.";
}

function renderResult() {
  const level = getLevel(appState.score);

  resultTitle.textContent = `Sua marca chegou em: ${level}`;
  resultScore.textContent = `${appState.score}/100 em Brand Awareness`;
  resultFeedback.textContent = getSmartFeedback(appState.score, level, appState);

  document.querySelectorAll(".pyramid-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.level === level);
  });

  explanationList.innerHTML = "";
  appState.breakdown.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `P${item.question} • ${item.points}/${MAX_POINTS_PER_QUESTION}: ${item.note}`;
    explanationList.appendChild(li);
  });

  explanationBox.hidden = true;
  explainBtn.textContent = "Ver explicação";

  showScreen(resultScreen);
}

function resetGame() {
  appState.currentQuestion = 0;
  appState.answers = {
    segment: null,
    essence: null,
    palette: null,
    strategy: null,
    touchpoint: null,
  };
  appState.breakdown = [];
  appState.score = 0;
  renderQuestion();
  showScreen(quizScreen);
}

startBtn.addEventListener("click", resetGame);
restartBtn.addEventListener("click", resetGame);
backBtn.addEventListener("click", previousQuestion);

explainBtn.addEventListener("click", () => {
  explanationBox.hidden = !explanationBox.hidden;
  explainBtn.textContent = explanationBox.hidden ? "Ver explicação" : "Ocultar explicação";
});

// Estado inicial da aplicação
showScreen(startScreen);