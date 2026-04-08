(function () {
  const data = window.MEDICAL_ENGLISH_QUIZ_DATA;

  if (!data) {
    document.body.innerHTML = "<main class=\"app-shell\"><section class=\"panel\"><h1>퀴즈 데이터를 불러오지 못했습니다.</h1><p>`quiz-data.js`가 정상적으로 로드되었는지 확인해 주세요.</p></section></main>";
    return;
  }

  const CATEGORY_LABELS = {
    vocabulary: "어휘",
    root: "어근",
    suffix: "접미어",
    prefix: "접두어"
  };

  const CATEGORY_BUCKETS = {
    root: "roots",
    suffix: "suffixes",
    prefix: "prefixes"
  };

  const MODE_LABELS = {
    korean: "한국어 대응어",
    definition: "영어 설명",
    image: "이미지",
    gloss: "영어 설명",
    cloze: "빈칸"
  };

  const HELP_CONTENT = {
    "setup-overview": {
      title: "설정 화면 안내",
      blocks: [
        { label: "이 화면의 기능", value: "학습 범위와 문제 형식을 고른 뒤 퀴즈를 시작하는 화면입니다." },
        { label: "문제 형식", value: "어휘, 어근, 접미어, 접두어, 이미지 문제를 함께 섞어서 학습할 수 있습니다." },
        { label: "테스트 데이터 확인", value: "테스트 데이터 보기에서 포함 단어, 뜻, 분해 form, 연결 이미지를 미리 확인할 수 있습니다." }
      ]
    },
    "range-mode": {
      title: "학습 방식",
      blocks: [
        { label: "누적 범위", value: "1주차부터 선택한 주차까지의 범위를 모두 포함합니다." },
        { label: "해당 주차만", value: "선택한 한 주차의 항목만 출제합니다." },
        { label: "선택 주차", value: "여러 주차를 직접 골라 묶어서 학습합니다." }
      ]
    },
    "week-select": {
      title: "주차 선택",
      blocks: [
        { label: "기본 선택", value: "학습 방식에 따라 한 주차 또는 마지막 주차를 선택합니다." },
        { label: "선택 주차 방식", value: "선택 주차 모드에서는 아래 체크 목록에서 원하는 주차를 직접 고릅니다." }
      ]
    },
    "question-count": {
      title: "문제 수",
      blocks: [
        { label: "고정 선택", value: "10, 20, 30처럼 미리 준비된 문제 수를 바로 선택할 수 있습니다." },
        { label: "직접 입력", value: "원하는 문제 수를 숫자로 직접 넣을 수 있습니다." },
        { label: "전체", value: "현재 범위에서 생성 가능한 모든 문제를 출제합니다." }
      ]
    },
    "vocabulary-mode": {
      title: "어휘 문제",
      blocks: [
        { label: "텍스트형", value: "한국어 대응어 또는 영어 설명을 보고 영어 어휘를 맞히는 문제입니다." },
        { label: "이미지형", value: "이미지를 보고 관련 영어 어휘를 맞히는 문제입니다." },
        { label: "문제 구성", value: "어휘 텍스트형과 이미지형은 같은 세션에서 함께 섞여 출제될 수 있습니다." }
      ]
    },
    "root-mode": {
      title: "어근 문제",
      blocks: [
        { label: "영어 설명형", value: "어근의 영어 설명을 보고 어근을 맞히는 문제입니다." },
        { label: "빈칸형", value: "실제 어휘의 빈칸을 보고 해당 어근을 맞히는 문제입니다." }
      ]
    },
    "suffix-mode": {
      title: "접미어 문제",
      blocks: [
        { label: "영어 설명형", value: "접미어의 영어 설명을 보고 접미어를 맞히는 문제입니다." },
        { label: "빈칸형", value: "실제 어휘의 빈칸을 보고 해당 접미어를 맞히는 문제입니다." }
      ]
    },
    "prefix-mode": {
      title: "접두어 문제",
      blocks: [
        { label: "영어 설명형", value: "접두어의 영어 설명을 보고 접두어를 맞히는 문제입니다." },
        { label: "빈칸형", value: "실제 어휘의 빈칸을 보고 해당 접두어를 맞히는 문제입니다." }
      ]
    },
    "layout-mode": {
      title: "실전 레이아웃",
      blocks: [
        { label: "실전 화면", value: "CBT 느낌의 실전 레이아웃으로 문제 화면을 바꿉니다." },
        { label: "적용 범위", value: "퀴즈를 시작한 뒤 문제 풀이 화면에만 적용됩니다." }
      ]
    },
    "combining-vowel": {
      title: "결합모음 정답 인정",
      blocks: [
        { label: "기본값", value: "기본적으로는 결합모음을 제외한 어근 형태만 정답으로 처리합니다." },
        { label: "체크 시", value: "예를 들어 gastr, gastro, gastr(o)처럼 결합모음 포함형도 정답으로 인정합니다." }
      ]
    }
  };

  const CLOZE_ONLY_TERMS = new Set([
    "-a",
    "-ac",
    "-al",
    "-ation",
    "-ary",
    "-e",
    "-eal",
    "-i",
    "-ic",
    "-in",
    "-ium",
    "-ology",
    "-ose",
    "-tic",
    "-tion",
    "-ual",
    "-um",
    "-us",
    "-ous",
    "-y",
    "a-",
    "an-",
    "in-",
    "un-"
  ]);
  const GLOSS_PROMPT_CONSTRAINTS = Object.freeze({
    "-osis": "정답에 알파벳 o를 포함하시오.",
    "-iasis": "정답에 알파벳 a를 포함하시오.",
    "-dynia": "정답에 알파벳 d를 포함하시오.",
    "-algia": "정답에 알파벳 g를 포함하시오.",
    "opt(o)": "정답에 알파벳 h를 포함하지 마시오.",
    "ophthalm(o)": "정답에 알파벳 h를 포함하시오.",
    "derm(o)": "정답에 알파벳 t를 포함하지 마시오.",
    "cutane(o)": "정답에 알파벳 c를 포함하시오.",
    "dermat(o)": "정답에 알파벳 d와 t를 모두 포함하시오.",
    "hem(o)": "정답에 알파벳 t를 포함하지 마시오.",
    "hemat(o)": "정답에 알파벳 t를 포함하시오.",
    "muscul(o)": "정답에 알파벳 u를 포함하시오.",
    "my(o)": "정답에 알파벳 y를 포함하시오.",
    "gloss(o)": "정답에 알파벳 i를 포함하지 마시오.",
    "lingu(o)": "정답에 알파벳 i를 포함하시오.",
    "con-": "정답에 알파벳 c를 포함하시오.",
    "syn-": "정답에 알파벳 s를 포함하시오.",
    "anti-": "정답에 알파벳 c를 포함하지 마시오.",
    "contra-": "정답에 알파벳 c를 포함하시오.",
    "hypo-": "정답에 알파벳 y를 포함하시오.",
    "infra-": "정답에 알파벳 f를 포함하시오.",
    "intra-": "정답에 알파벳 t를 포함하시오.",
    "endo-": "정답에 알파벳 d를 포함하시오.",
    "sub-": "정답에 알파벳 s를 포함하시오.",
    "-genic": "정답에 알파벳 c를 포함하시오.",
    "-genous": "정답에 알파벳 u를 포함하시오.",
    "ecto-": "정답에 알파벳 c를 포함하시오.",
    "ex-": "정답에 알파벳 x를 포함하시오.",
    "hyper-": "정답에 알파벳 y를 포함하시오.",
    "supra-": "정답에 알파벳 a를 포함하시오.",
    "super-": "정답에 알파벳 e를 포함하고 a와 y를 포함하지 마시오.",
    "ante-": "정답에 알파벳 n을 포함하시오.",
    "pre-": "정답에 연속 알파벳 re를 포함하시오.",
    "pro-": "정답에 알파벳 o를 포함하시오.",
    "cellul(o)": "정답에 알파벳 u를 포함하시오.",
    "cyt(o)": "정답에 알파벳 y를 포함하시오.",
    "nas(o)": "정답에 알파벳 a를 포함하시오.",
    "rhin(o)": "정답에 알파벳 h를 포함하시오.",
    "hypn(o)": "정답에 알파벳 h를 포함하시오.",
    "somn(i)": "정답에 알파벳 s를 포함하시오.",
    "alb(o)": "정답에 알파벳 a를 포함하시오.",
    "leuk(o)": "정답에 알파벳 e를 포함하시오."
  });
  const VOCAB_PROMPT_CONSTRAINTS = Object.freeze({
    "hypodermic": "정답에 알파벳 h를 포함하시오.",
    "subcutaneous": "정답에 알파벳 s를 포함하시오.",
    "gastralgia": "정답에 알파벳 d를 포함하지 마시오.",
    "gastrodynia": "정답에 알파벳 d를 포함하시오.",
    "thoracentesis": "정답에 연속 알파벳 co를 포함하지 마시오.",
    "thoracocentesis": "정답에 연속 알파벳 co를 포함하시오.",
    "hematopoiesis": "정답에 알파벳 t를 포함하시오.",
    "hemopoiesis": "정답에 알파벳 t를 포함하지 마시오.",
    "membraneous": "정답에 연속 알파벳 eo를 포함하시오.",
    "membranous": "정답에 연속 알파벳 eo를 포함하지 마시오.",
    "polydactylia": "정답을 a로 끝내시오.",
    "polydactyly": "정답을 y로 끝내시오.",
    "syndactylia": "정답을 a로 끝내시오.",
    "syndactyly": "정답을 y로 끝내시오.",
    "subglossal": "정답에 알파벳 i를 포함하지 마시오.",
    "sublingual": "정답에 알파벳 i를 포함하시오.",
    "oral administration": "정답에 알파벳 o를 포함하시오.",
    "peroral administration": "정답에 알파벳 p를 포함하시오.",
    "quadriplegia": "정답에 알파벳 q를 포함하시오.",
    "tetraplegia": "정답에 알파벳 t를 포함하시오.",
    "trachea": "정답에 알파벳 t를 포함하시오.",
    "windpipe": "정답에 알파벳 w를 포함하시오.",
    "esophagus": "정답에 알파벳 s를 포함하시오.",
    "gullet": "정답에 알파벳 g를 포함하시오."
  });
  const VOCAB_IMAGE_PROMPT_OVERRIDES = Object.freeze({
    electrocardiograph: {
      plain: {
        title: "그림의 기기 명칭은?"
      }
    },
    endoscopy: {
      plain: {
        title: "소화기내과 전문의가 손에 쥐고 있는 기기 명칭은?",
        answer: "endoscope",
        acceptedAnswers: ["endoscope"],
        displayAnswer: "Endoscope",
        alt: "Endoscope 관련 이미지"
      }
    }
  });

  const MULTIWORD_VOCAB_RULES = Object.freeze({
    "acquired immunodeficiency syndrome": Object.freeze({ mode: "whole" }),
    "autonomic nervous system": Object.freeze({ mode: "whole" }),
    "central nervous system": Object.freeze({ mode: "whole" }),
    "peripheral nervous system": Object.freeze({ mode: "whole" }),
    "nasal cavity": Object.freeze({ mode: "whole" }),
    "oral cavity": Object.freeze({ mode: "whole" }),
    "substantia nigra": Object.freeze({ mode: "whole" }),
    "cerebellar hemisphere": Object.freeze({ blankWordIndexes: Object.freeze([0, 1]) }),
    "cerebral hemisphere": Object.freeze({ blankWordIndexes: Object.freeze([0, 1]) }),
    "muscular atrophy": Object.freeze({ blankWordIndexes: Object.freeze([0, 1]) }),
    "paranasal sinus": Object.freeze({ blankWordIndexes: Object.freeze([0, 1]) }),
    "venous stasis": Object.freeze({ blankWordIndexes: Object.freeze([0, 1]) }),
    "pyloric sphincter": Object.freeze({ blankWordIndexes: Object.freeze([0, 1]) }),
    "pyloric stenosis": Object.freeze({ blankWordIndexes: Object.freeze([0, 1]) }),
    "precancerous lesion": Object.freeze({ blankWordIndexes: Object.freeze([0, 1]) })
  });

  const state = {
    questions: [],
    currentIndex: 0,
    score: 0,
    remainingSeconds: 25,
    timerId: null,
    advanceTimerId: null,
    locked: false,
    missed: [],
    selectedListTerm: null,
    layoutMode: "default",
    examAnswerDraft: ""
  };

  const setupPanel = document.getElementById("setup-panel");
  const listPanel = document.getElementById("list-panel");
  const quizPanel = document.getElementById("quiz-panel");
  const resultPanel = document.getElementById("result-panel");
  const rangeModeSelect = document.getElementById("range-mode-select");
  const weekSelectField = document.getElementById("week-select-field");
  const weekSelect = document.getElementById("week-select");
  const questionCountSelect = document.getElementById("question-count");
  const customWeekField = document.getElementById("custom-week-field");
  const customWeekOptions = document.getElementById("custom-week-options");
  const customQuestionField = document.getElementById("custom-question-field");
  const customQuestionCountInput = document.getElementById("custom-question-count");
  const rootAllowCombiningVowelCheckbox = document.getElementById("root-allow-combining-vowel");
  const layoutModeCheckbox = document.getElementById("layout-mode-checkbox");
  const listCategoryFilter = document.getElementById("list-category-filter");
  const dataSummary = document.getElementById("data-summary");
  const setupHelpButton = document.getElementById("setup-help-button");
  const listSummary = document.getElementById("list-summary");
  const listDetail = document.getElementById("list-detail");
  const listDetailBackdrop = document.getElementById("list-detail-backdrop");
  const listDetailTitle = document.getElementById("list-detail-title");
  const listDetailContent = document.getElementById("list-detail-content");
  const listDetailCloseButton = document.getElementById("list-detail-close");
  const helpModal = document.getElementById("help-modal");
  const helpBackdrop = document.getElementById("help-backdrop");
  const helpTitle = document.getElementById("help-title");
  const helpContent = document.getElementById("help-content");
  const helpCloseButton = document.getElementById("help-close");
  const listGroups = document.getElementById("list-groups");
  const startButton = document.getElementById("start-button");
  const openListButton = document.getElementById("open-list-button");
  const closeListButton = document.getElementById("close-list-button");
  const submitButton = document.getElementById("submit-button");
  const skipButton = document.getElementById("skip-button");
  const nextButton = document.getElementById("next-button");
  const restartButton = document.getElementById("restart-button");
  const progressText = document.getElementById("progress-text");
  const scoreText = document.getElementById("score-text");
  const timerText = document.getElementById("timer-text");
  const examTimerText = document.getElementById("exam-timer-text");
  const examSessionMeta = document.getElementById("exam-session-meta");
  const examAnswerVisibilityCheckbox = document.getElementById("exam-answer-visibility");
  const progressFill = document.getElementById("progress-fill");
  const metaWeek = document.getElementById("meta-week");
  const metaCategory = document.getElementById("meta-category");
  const metaMode = document.getElementById("meta-mode");
  const questionTitle = document.getElementById("question-title");
  const questionBody = document.getElementById("question-body");
  const answerLabel = document.getElementById("answer-label");
  const answerInput = document.getElementById("answer-input");
  const feedback = document.getElementById("feedback");
  const resultSummary = document.getElementById("result-summary");
  const resultStats = document.getElementById("result-stats");
  const missedList = document.getElementById("missed-list");

  initialize();

  function initialize() {
    populateWeekSelect();
    populateCustomWeekOptions();
    updateRangeModeUI();
    updateQuestionCountUI();
    renderDataSummary();
    syncViewState();
    rangeModeSelect.addEventListener("change", handleRangeModeChange);
    weekSelect.addEventListener("change", () => {
      populateCustomWeekOptions();
      syncListViewIfOpen();
    });
    questionCountSelect.addEventListener("change", () => {
      updateQuestionCountUI();
      syncListViewIfOpen();
    });
    listCategoryFilter.addEventListener("change", syncListViewIfOpen);
    customWeekOptions.addEventListener("change", syncListViewIfOpen);
    customQuestionCountInput.addEventListener("input", syncListViewIfOpen);
    startButton.addEventListener("click", startQuiz);
    openListButton.addEventListener("click", openListView);
    closeListButton.addEventListener("click", closeListView);
    submitButton.addEventListener("click", () => submitAnswer(false, false));
    skipButton.addEventListener("click", () => submitAnswer(false, true));
    nextButton.addEventListener("click", goToNextQuestion);
    restartButton.addEventListener("click", resetToSetup);
    if (setupHelpButton) {
      setupHelpButton.addEventListener("click", () => openHelpModal("setup-overview"));
    }
    if (examAnswerVisibilityCheckbox) {
      examAnswerVisibilityCheckbox.addEventListener("change", syncExamAnswerVisibility);
    }
    if (listDetailBackdrop) {
      listDetailBackdrop.addEventListener("click", handleListDetailClose);
    }
    if (listDetailCloseButton) {
      listDetailCloseButton.addEventListener("click", handleListDetailClose);
    }
    if (helpBackdrop) {
      helpBackdrop.addEventListener("click", closeHelpModal);
    }
    if (helpCloseButton) {
      helpCloseButton.addEventListener("click", closeHelpModal);
    }

    answerInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        if (handleExamAnswerKeydown(event)) {
          return;
        }

        return;
      }

      event.preventDefault();
      if (!nextButton.classList.contains("hidden")) {
        goToNextQuestion();
        return;
      }

      submitAnswer(false);
    });
    answerInput.addEventListener("input", syncExamDraftFromInput);
    answerInput.addEventListener("paste", handleExamAnswerPaste);
    answerInput.addEventListener("click", keepExamCaretAtEnd);
    answerInput.addEventListener("focus", keepExamCaretAtEnd);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && listDetail && !listDetail.classList.contains("hidden")) {
        handleListDetailClose();
        return;
      }

      if (event.key === "Escape" && helpModal && !helpModal.classList.contains("hidden")) {
        closeHelpModal();
      }
    });
  }

  function openHelpModal(key) {
    const content = HELP_CONTENT[key];
    if (!content || !helpModal || !helpTitle || !helpContent) {
      return;
    }

    const body = content.blocks
      .map((block) => `
        <section class="list-detail-block">
          <span class="list-detail-label">${block.label}</span>
          <div class="list-detail-value">${block.value}</div>
        </section>
      `)
      .join("");

    helpTitle.textContent = content.title;
    helpContent.innerHTML = `<div class="list-detail-grid">${body}</div>`;
    helpModal.classList.remove("hidden");
    helpModal.setAttribute("aria-hidden", "false");
  }

  function closeHelpModal() {
    if (!helpModal) {
      return;
    }

    helpModal.classList.add("hidden");
    helpModal.setAttribute("aria-hidden", "true");
  }

  function populateWeekSelect() {
    data.weeks
      .slice()
      .sort((left, right) => left.week - right.week)
      .forEach((weekInfo) => {
        const option = document.createElement("option");
        option.value = String(weekInfo.week);
        option.textContent = `${weekInfo.week}주차`;
        weekSelect.appendChild(option);
      });

    if (data.weeks.length > 0) {
      weekSelect.value = String(data.weeks[data.weeks.length - 1].week);
    }
  }

  function populateCustomWeekOptions() {
    customWeekOptions.innerHTML = "";

    data.weeks
      .slice()
      .sort((left, right) => left.week - right.week)
      .forEach((weekInfo) => {
        const label = document.createElement("label");
        label.className = "checkbox choice-chip";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = String(weekInfo.week);
        input.dataset.customWeek = "true";
        if (String(weekInfo.week) === weekSelect.value) {
          input.checked = true;
        }

        const span = document.createElement("span");
        span.textContent = `${weekInfo.week}주차`;

        label.appendChild(input);
        label.appendChild(span);
        customWeekOptions.appendChild(label);
      });
  }

  function renderDataSummary() {
    const weekCount = data.weeks.length;
    const entryCount = Object.keys(data.entries).length;
    const missingCount = data.missingEntries.length;
    const summary = [
      `${weekCount}개 주차`,
      `${entryCount}개 항목`
    ];

    if (missingCount > 0) {
      summary.push(`출제에서 제외된 누락 항목 ${missingCount}개`);
    }

    dataSummary.textContent = summary.join(" / ");
  }

  function handleRangeModeChange() {
    updateRangeModeUI();
    syncListViewIfOpen();
  }

  function updateRangeModeUI() {
    const isCustom = rangeModeSelect.value === "custom";

    weekSelectField.classList.toggle("hidden", isCustom);
    customWeekField.classList.toggle("hidden", !isCustom);

    if (isCustom) {
      seedCustomWeekSelection();
    }
  }

  function updateQuestionCountUI() {
    const isCustom = questionCountSelect.value === "custom";
    customQuestionField.classList.toggle("hidden", !isCustom);

    if (isCustom && !customQuestionCountInput.value) {
      customQuestionCountInput.value = "20";
    }
  }

  function seedCustomWeekSelection() {
    const checkedWeeks = getSelectedCustomWeeks();
    if (checkedWeeks.length > 0) {
      return;
    }

    const fallbackWeek = weekSelect.value;
    const fallbackInput = customWeekOptions.querySelector(`input[data-custom-week="true"][value="${fallbackWeek}"]`);
    if (fallbackInput) {
      fallbackInput.checked = true;
    }
  }

  function getSelectedCustomWeeks() {
    return Array.from(customWeekOptions.querySelectorAll("input[data-custom-week=\"true\"]:checked"))
      .map((input) => Number(input.value))
      .filter((value) => Number.isFinite(value))
      .sort((left, right) => left - right);
  }

  function getScopeConfig(shouldValidate) {
    const rangeMode = rangeModeSelect.value;
    const allWeeks = data.weeks
      .map((weekInfo) => weekInfo.week)
      .sort((left, right) => left - right);

    if (rangeMode === "custom") {
      const selectedWeeks = getSelectedCustomWeeks();
      if (shouldValidate && selectedWeeks.length === 0) {
        window.alert("선택 주차 모드에서는 최소 한 개 이상의 주차를 선택해 주세요.");
        return null;
      }

      return {
        rangeMode,
        weeks: selectedWeeks,
        maxWeek: selectedWeeks.length > 0 ? selectedWeeks[selectedWeeks.length - 1] : 0
      };
    }

    const selectedWeek = Number(weekSelect.value);
    const weeks = allWeeks.filter((week) => rangeMode === "single" ? week === selectedWeek : week <= selectedWeek);

    return {
      rangeMode,
      weeks,
      maxWeek: selectedWeek
    };
  }

  function getQuestionLimit(totalQuestions) {
    const value = questionCountSelect.value;

    if (value === "all") {
      return totalQuestions;
    }

    if (value === "custom") {
      const customValue = Number(customQuestionCountInput.value);
      if (!Number.isInteger(customValue) || customValue < 1) {
        window.alert("직접 입력 문제 수는 1 이상의 정수로 입력해 주세요.");
        return null;
      }

      return customValue;
    }

    return Number(value);
  }

  function describeScope(scopeConfig) {
    if (scopeConfig.rangeMode === "single") {
      return `${scopeConfig.maxWeek}주차만`;
    }

    if (scopeConfig.rangeMode === "custom") {
      if (scopeConfig.weeks.length === 0) {
        return "\uC120\uD0DD \uC8FC\uCC28 \uC5C6\uC74C";
      }

      return `선택 주차: ${scopeConfig.weeks.map((week) => `${week}주차`).join(", ")}`;
    }

    return `1-${scopeConfig.maxWeek}주차 누적`;
  }

  function applyLayoutMode() {
    document.body.classList.toggle("quiz-layout-exam", state.layoutMode === "exam" && !quizPanel.classList.contains("hidden"));
  }

  function syncViewState() {
    document.body.classList.toggle("view-setup", !setupPanel.classList.contains("hidden"));
    document.body.classList.toggle("view-list", !listPanel.classList.contains("hidden"));
    document.body.classList.toggle("view-quiz", !quizPanel.classList.contains("hidden"));
    document.body.classList.toggle("view-result", !resultPanel.classList.contains("hidden"));
  }

  function isExamLayout() {
    return state.layoutMode === "exam";
  }

  function syncExamAnswerVisibility() {
    if (!isExamLayout()) {
      answerInput.classList.remove("exam-answer-masked");
      return;
    }

    answerInput.classList.toggle("exam-answer-masked", !(examAnswerVisibilityCheckbox && examAnswerVisibilityCheckbox.checked));
    answerInput.value = state.examAnswerDraft;
    keepExamCaretAtEnd();
  }

  function isExamAnswerProtected() {
    return isExamLayout() && !(examAnswerVisibilityCheckbox && examAnswerVisibilityCheckbox.checked);
  }

  function keepExamCaretAtEnd() {
    if (!isExamAnswerProtected()) {
      return;
    }

    const end = answerInput.value.length;
    window.setTimeout(() => {
      try {
        answerInput.setSelectionRange(end, end);
      } catch (error) {
        return;
      }
    }, 0);
  }

  function handleExamAnswerKeydown(event) {
    if (!isExamAnswerProtected() || answerInput.disabled) {
      return false;
    }

    const blockedKeys = new Set([
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
      "PageUp",
      "PageDown"
    ]);

    if (blockedKeys.has(event.key)) {
      event.preventDefault();
      keepExamCaretAtEnd();
      return true;
    }

    if (event.ctrlKey || event.metaKey) {
      const loweredKey = event.key.toLowerCase();
      if (["a", "v", "x", "y", "z"].includes(loweredKey)) {
        event.preventDefault();
        keepExamCaretAtEnd();
        return true;
      }
    }

    if (event.altKey) {
      return false;
    }

    return false;
  }

  function syncExamDraftFromInput() {
    if (!isExamLayout()) {
      return;
    }

    if (examAnswerVisibilityCheckbox && examAnswerVisibilityCheckbox.checked) {
      state.examAnswerDraft = answerInput.value;
      return;
    }

    if (answerInput.value.startsWith(state.examAnswerDraft)) {
      state.examAnswerDraft = answerInput.value;
    }

    answerInput.value = state.examAnswerDraft;
    keepExamCaretAtEnd();
  }

  function handleExamAnswerPaste(event) {
    if (!isExamAnswerProtected() || answerInput.disabled) {
      return;
    }

    const pastedText = event.clipboardData ? event.clipboardData.getData("text") : "";
    if (!pastedText) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    state.examAnswerDraft += pastedText;
    answerInput.value = state.examAnswerDraft;
    keepExamCaretAtEnd();
  }

  function getCurrentAnswerValue() {
    return isExamLayout() ? state.examAnswerDraft : answerInput.value;
  }

  function isAnswerCorrect(question, userInput) {
    const normalizedInput = normalize(userInput);
    if (!normalizedInput) {
      return false;
    }

    const acceptedAnswers = Array.isArray(question.acceptedAnswers)
      ? question.acceptedAnswers.map((answer) => normalize(answer)).filter(Boolean)
      : [];

    return acceptedAnswers.includes(normalizedInput);
  }

  function startQuiz() {
    try {
      const selectedModes = Array.from(document.querySelectorAll(".mode-groups input[type=\"checkbox\"]:checked"))
        .map((element) => element.value);
      const scopeConfig = getScopeConfig(true);
      const allowCombiningVowel = rootAllowCombiningVowelCheckbox.checked;

      if (!scopeConfig) {
        return;
      }

      if (selectedModes.length === 0) {
        window.alert("최소 한 개 이상의 문제 형식을 선택해 주세요.");
        return;
      }

      let questions = buildQuestionPool(scopeConfig, selectedModes, allowCombiningVowel);
      if (questions.length === 0) {
        window.alert("선택한 범위와 문제 형식으로 만들 수 있는 문제가 없습니다.");
        return;
      }

      questions = shuffle(questions);
      const questionLimit = getQuestionLimit(questions.length);
      if (questionLimit === null) {
        return;
      }
      questions = questions.slice(0, Math.min(questionLimit, questions.length));

      state.questions = questions;
      state.currentIndex = 0;
      state.score = 0;
      state.missed = [];
      state.layoutMode = layoutModeCheckbox && layoutModeCheckbox.checked ? "exam" : "default";
      scoreText.textContent = "0";

      setupPanel.classList.add("hidden");
      resultPanel.classList.add("hidden");
      quizPanel.classList.remove("hidden");
      applyLayoutMode();
      syncViewState();

      renderQuestion();
    } catch (error) {
      console.error("퀴즈 시작 실패", error);
      window.alert("퀴즈를 시작하는 중 오류가 발생했습니다. 새로고침 후 다시 시도해 주세요.");
    }
  }

  function openListView() {
    setupPanel.classList.add("hidden");
    quizPanel.classList.add("hidden");
    resultPanel.classList.add("hidden");
    applyLayoutMode();
    listPanel.classList.remove("hidden");
    syncViewState();
    renderListView();
  }

  function closeListView() {
    listPanel.classList.add("hidden");
    closeListDetail();
    state.selectedListTerm = null;
    setupPanel.classList.remove("hidden");
    applyLayoutMode();
    syncViewState();
  }

  function syncListViewIfOpen() {
    if (!listPanel.classList.contains("hidden")) {
      renderListView();
    }
  }

  function createQuestion(config) {
    return {
      id: config.id,
      week: config.week,
      category: config.category,
      mode: config.mode,
      term: config.term,
      prompt: config.prompt,
      answer: config.answer,
      acceptedAnswers: config.acceptedAnswers,
      displayAnswer: config.displayAnswer
    };
  }

  function buildQuestionPool(scopeConfig, selectedModes, allowCombiningVowel) {
    const scopedTerms = getScopedTerms(scopeConfig);
    const vocabularyTerms = scopedTerms.vocabulary;
    const morphologyVocabulary = vocabularyTerms
      .map((term) => getEntry(term))
      .filter(Boolean);
    const selectedModeSet = new Set(selectedModes);
    const questions = [];

    vocabularyTerms.forEach((term) => {
      const entry = getEntry(term);
      if (!entry || (!entry.korean && !entry.english)) {
        return;
      }

      if (selectedModeSet.has("vocabulary:korean")) {
        try {
          const promptInfo = buildVocabularyQuestionConfig(entry, allowCombiningVowel);

          questions.push(createQuestion({
            id: `vocabulary:korean:${entry.term}`,
            week: findIntroducedWeek(entry.term, "vocabulary", scopeConfig),
            category: "vocabulary",
            mode: promptInfo.mode,
            term: entry.term,
            prompt: promptInfo.prompt,
            answer: promptInfo.answer,
            acceptedAnswers: promptInfo.acceptedAnswers,
            displayAnswer: promptInfo.displayAnswer
          }));
        } catch (error) {
          console.warn("어휘 텍스트형 문항 생성 실패", entry.term, error);
        }
      }

      if (selectedModeSet.has("vocabulary:image") && Array.isArray(entry.imageQuestions)) {
        entry.imageQuestions.forEach((imageInfo, index) => {
          try {
            const imageQuestionConfig = buildVocabularyImageQuestionConfig(entry, imageInfo, allowCombiningVowel);
            questions.push(createQuestion({
              id: `vocabulary:image:${entry.term}:${index}`,
              week: findIntroducedWeek(entry.term, "vocabulary", scopeConfig),
              category: "vocabulary",
              mode: "image",
              term: entry.term,
              prompt: imageQuestionConfig.prompt,
              answer: imageQuestionConfig.answer,
              acceptedAnswers: imageQuestionConfig.acceptedAnswers,
              displayAnswer: imageQuestionConfig.displayAnswer
            }));
          } catch (error) {
            console.warn("어휘 이미지형 문항 생성 실패", entry.term, error);
          }
        });
      }
    });

    ["root", "suffix", "prefix"].forEach((category) => {
      scopedTerms[CATEGORY_BUCKETS[category]].forEach((term) => {
        const entry = getEntry(term);
        if (!entry) {
          return;
        }

        if (selectedModeSet.has(`${category}:gloss`) && entry.english && !isClozeOnlyTerm(entry)) {
          try {
            const glossPrompt = buildMorphologyGlossPrompt(entry);
            questions.push(createQuestion({
              id: `${category}:gloss:${entry.term}`,
              week: findIntroducedWeek(entry.term, CATEGORY_BUCKETS[category], scopeConfig),
              category,
              mode: "gloss",
              term: entry.term,
              prompt: glossPrompt,
              answer: entry.answer,
              acceptedAnswers: getAcceptedAnswers(entry, allowCombiningVowel),
              displayAnswer: entry.answer
            }));
          } catch (error) {
            console.warn("형태소 영어 설명형 문항 생성 실패", entry.term, error);
          }
        }

        if (selectedModeSet.has(`${category}:cloze`)) {
          try {
            const cloze = buildClozePrompt(entry, morphologyVocabulary, scopeConfig, scopedTerms[CATEGORY_BUCKETS[category]], scopedTerms);
            if (!cloze) {
              return;
            }

            questions.push(createQuestion({
              id: `${category}:cloze:${entry.term}:${cloze.word}`,
              week: findIntroducedWeek(entry.term, CATEGORY_BUCKETS[category], scopeConfig),
              category,
              mode: "cloze",
              term: entry.term,
              prompt: {
                title: cloze.title,
                blocks: cloze.blocks
              },
              answer: entry.answer,
              acceptedAnswers: getAcceptedAnswers(entry, allowCombiningVowel),
              displayAnswer: entry.answer
            }));
          } catch (error) {
            console.warn("형태소 빈칸형 문항 생성 실패", entry.term, error);
          }
        }
      });
    });

    return questions;
  }

  function getScopedTerms(scopeConfig) {
    const buckets = {
      vocabulary: [],
      roots: [],
      suffixes: [],
      prefixes: []
    };
    const seen = {
      vocabulary: new Set(),
      roots: new Set(),
      suffixes: new Set(),
      prefixes: new Set()
    };
    const selectedWeekSet = new Set(scopeConfig.weeks);

    const selectedWeeks = data.weeks
      .filter((weekInfo) => selectedWeekSet.has(weekInfo.week))
      .sort((left, right) => left.week - right.week)
    selectedWeeks.forEach((weekInfo) => {
        Object.keys(buckets).forEach((bucketName) => {
          weekInfo.items[bucketName].forEach((term) => {
            const key = term.toLowerCase();
            if (seen[bucketName].has(key)) {
              return;
            }

            if (!getEntry(term)) {
              return;
            }

            seen[bucketName].add(key);
            buckets[bucketName].push(term);
          });
        });
      });

    return buckets;
  }

  function renderListView() {
    const scopeConfig = getScopeConfig(false);
    const categoryFilter = listCategoryFilter.value;
    const scopedTerms = getScopedTerms(scopeConfig);
    const groups = getListGroups(scopedTerms, categoryFilter);
    const totalCount = groups.reduce((sum, group) => sum + group.terms.length, 0);
    const rangeLabel = describeScope(scopeConfig);
    const categoryLabel = categoryFilter === "all"
      ? "\uC804\uCCB4 / \uC804\uCCB4"
      : CATEGORY_LABELS[categoryFilter];

    listSummary.textContent = `${rangeLabel} / ${categoryLabel} / ${totalCount}개`;
    listGroups.innerHTML = "";

    if (groups.length === 0) {
      const empty = document.createElement("article");
      empty.className = "list-group";
      empty.innerHTML = "<h3>표시할 항목이 없습니다.</h3>";
      listGroups.appendChild(empty);
      closeListDetail();
      return;
    }

    let hasSelectedTermInView = false;

    groups.forEach((group) => {
      const section = document.createElement("article");
      section.className = "list-group";

      const heading = document.createElement("h3");
      heading.textContent = `${group.label} (${group.terms.length})`;
      section.appendChild(heading);

      const termWrap = document.createElement("div");
      termWrap.className = "list-terms";

      group.terms.forEach((term) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "term-chip term-chip-button";
        chip.textContent = getListDisplayTerm(term);
        chip.addEventListener("click", () => {
          state.selectedListTerm = term;
          renderListView();
        });
        if (state.selectedListTerm && state.selectedListTerm.toLowerCase() === term.toLowerCase()) {
          chip.classList.add("active");
          hasSelectedTermInView = true;
        }
        termWrap.appendChild(chip);
      });

      section.appendChild(termWrap);
      listGroups.appendChild(section);
    });

    if (hasSelectedTermInView) {
      renderListDetail(state.selectedListTerm);
      return;
    }

    state.selectedListTerm = null;
    closeListDetail();
  }

  function renderListDetail(term) {
    if (!term) {
      closeListDetail();
      return;
    }

    const entry = getEntry(term);
    if (!entry) {
      if (!listDetail || !listDetailTitle || !listDetailContent) {
        return;
      }
      listDetailTitle.textContent = "\uD56D\uBAA9 \uC815\uBCF4";
      listDetailContent.innerHTML = "<p class=\"muted\">표시할 정보가 없습니다.</p>";
      listDetail.classList.remove("hidden");
      listDetail.setAttribute("aria-hidden", "false");
      return;
    }

    const blocks = [];
    const morphologyForm = entry.type === "vocabulary" ? formatMorphologyForm(entry) : "";
    const detailImages = entry.type === "vocabulary" ? getListDetailImages(entry) : [];
    if (entry.korean) {
      blocks.push({ label: "\uD55C\uAD6D\uC5B4", value: entry.korean });
    }
    if (hasUsableEnglishClue(entry)) {
      blocks.push({ label: entry.type === "vocabulary" ? "\uC601\uC5B4 \uB73B\uD480\uC774" : "\uC601\uC5B4 \uC124\uBA85", value: entry.english });
    }

    if (morphologyForm) {
      blocks.push({ label: "분해 form", value: morphologyForm });
    }

    if (blocks.length === 0) {
      blocks.push({ label: "안내", value: "표시할 정보가 없습니다." });
    }

    if (!listDetail || !listDetailTitle || !listDetailContent) {
      return;
    }

    const body = blocks
      .map((block) => `
        <section class="list-detail-block">
          <span class="list-detail-label">${block.label}</span>
          <div class="list-detail-value">${cleanupDisplay(block.value)}</div>
        </section>
      `)
      .join("");
    const imageBody = detailImages.length > 0
      ? `
        <section class="list-detail-block">
          <span class="list-detail-label">연결 이미지</span>
          <div class="list-detail-image-grid">
            ${detailImages.map((image) => `
              <div class="list-detail-image-frame">
                <img class="list-detail-image" src="${image.src}" alt="${image.alt}">
              </div>
            `).join("")}
          </div>
        </section>
      `
      : "";

    listDetailTitle.textContent = getListDisplayTerm(entry.term);
    listDetailContent.innerHTML = `<div class="list-detail-grid">${body}${imageBody}</div>`;
    listDetail.classList.remove("hidden");
    listDetail.setAttribute("aria-hidden", "false");
  }

  function closeListDetail() {
    if (!listDetail) {
      return;
    }
    listDetail.classList.add("hidden");
    listDetail.setAttribute("aria-hidden", "true");
  }

  function handleListDetailClose() {
    state.selectedListTerm = null;
    closeListDetail();

    if (!listPanel.classList.contains("hidden")) {
      renderListView();
    }
  }

  function getListGroups(scopedTerms, categoryFilter) {
    const categories = categoryFilter === "all"
      ? ["vocabulary", "root", "suffix", "prefix"]
      : [categoryFilter];

    return categories
      .map((category) => {
        const bucketName = category === "vocabulary" ? "vocabulary" : CATEGORY_BUCKETS[category];
        const terms = scopedTerms[bucketName]
          .slice()
          .sort((left, right) => compareListTerms(left, right));
        return {
          label: CATEGORY_LABELS[category],
          terms
        };
      })
      .filter((group) => group.terms.length > 0);
  }

  function compareListTerms(left, right) {
    const leftLabel = getListDisplayTerm(left);
    const rightLabel = getListDisplayTerm(right);
    return leftLabel.localeCompare(rightLabel, "en", { sensitivity: "base" });
  }

  function getListDisplayTerm(term) {
    const entry = getEntry(term);
    const source = entry ? cleanupDisplay(entry.term) : cleanupDisplay(term);

    if (!entry) {
      return source;
    }

    if (entry.type === "vocabulary") {
      return source.replace(/^[a-z]/, (match) => match.toUpperCase());
    }

    return source.replace(/^[A-Z]/, (match) => match.toLowerCase());
  }

  function getEntry(term) {
    return data.entries[term.toLowerCase()] || null;
  }

  function formatMorphologyForm(entry) {
    if (!entry || !entry.morphology) {
      return "";
    }

    const parts = [];
    [entry.morphology.prefixes, entry.morphology.vocabulary, entry.morphology.roots, entry.morphology.suffixes].forEach((bucket) => {
      (bucket || []).forEach((part) => {
        const cleaned = cleanupDisplay(part).toLowerCase();
        if (cleaned) {
          parts.push(cleaned);
        }
      });
    });

    return parts.length > 0 ? parts.join(" + ") : "";
  }

  function getListDetailImages(entry) {
    if (!entry || !Array.isArray(entry.imageQuestions) || entry.imageQuestions.length === 0) {
      return [];
    }

    const seen = new Set();
    return entry.imageQuestions
      .filter((image) => {
        if (!image || !image.src || seen.has(image.src)) {
          return false;
        }
        seen.add(image.src);
        return true;
      })
      .map((image) => ({
        src: image.src,
        alt: `${entry.term} 연결 이미지`
      }));
  }

  function getAcceptedAnswers(entry, allowCombiningVowel) {
    if (entry.type === "root" && !allowCombiningVowel) {
      return [entry.answer];
    }

    return entry.answers;
  }

  function isClozeOnlyTerm(entry) {
    if (!entry) {
      return false;
    }

    if (CLOZE_ONLY_TERMS.has(entry.term.toLowerCase())) {
      return true;
    }

    return entry.type === "suffix" && /(^|[;,\s])pertaining to\b/i.test(entry.english || "");
  }

  function findIntroducedWeek(term, bucketName, scopeConfig) {
    const lowered = term.toLowerCase();
    const selectedWeekSet = new Set(scopeConfig.weeks);
    const match = data.weeks
      .filter((weekInfo) => selectedWeekSet.has(weekInfo.week))
      .sort((left, right) => left.week - right.week)
      .find((weekInfo) => weekInfo.items[bucketName].some((item) => item.toLowerCase() === lowered));

    return match ? `${match.week}\uC8FC\uCC28` : "\uC8FC\uCC28 \uBBF8\uC0C1";
  }

  function buildMorphologyGlossPrompt(entry) {
    const constraint = GLOSS_PROMPT_CONSTRAINTS[entry.term.toLowerCase()];
    const title = constraint
      ? `영어 설명을 보고 ${CATEGORY_LABELS[entry.type]}를 쓰시오. 조건: ${constraint}`
      : `영어 설명을 보고 ${CATEGORY_LABELS[entry.type]}를 쓰시오.`;

    return {
      title,
      blocks: [
        { label: "영어 설명", value: entry.english }
      ]
    };
  }

  function buildVocabularyQuestionConfig(entry, allowCombiningVowel) {
    const clozeConfig = buildVocabularyMultiwordClozeConfig(entry);
    if (clozeConfig) {
      return clozeConfig;
    }

    const promptInfo = buildVocabularyPrompt(entry);
    return {
      mode: promptInfo.mode,
      prompt: promptInfo.prompt,
      answer: entry.answer,
      acceptedAnswers: getAcceptedAnswers(entry, allowCombiningVowel),
      displayAnswer: entry.term
    };
  }

  function buildVocabularyPrompt(entry) {
    const constraint = VOCAB_PROMPT_CONSTRAINTS[entry.term.toLowerCase()];
    const title = constraint
      ? `뜻풀이를 보고 영어 어휘를 쓰시오. 조건: ${constraint}`
      : "뜻풀이를 보고 영어 어휘를 쓰시오.";
    const choices = [];

    if (entry.korean) {
      choices.push({
        mode: "korean",
        prompt: {
          title,
          blocks: [
            { label: "한국어 대응어", value: entry.korean }
          ]
        }
      });
    }

    if (entry.english) {
      choices.push({
        mode: "definition",
        prompt: {
          title,
          blocks: [
            { label: "영어 설명", value: entry.english }
          ]
        }
      });
    }

    return choices[Math.floor(Math.random() * choices.length)];
  }

  function buildVocabularyMultiwordClozeConfig(entry) {
    const words = entry.term.split(" ");
    if (words.length < 2) {
      return null;
    }

    const rule = MULTIWORD_VOCAB_RULES[entry.term.toLowerCase()];
    if (rule && rule.mode === "whole") {
      return null;
    }

    const blankWordIndexes = Array.isArray(rule?.blankWordIndexes) && rule.blankWordIndexes.length > 0
      ? rule.blankWordIndexes
      : [0];
    const candidates = blankWordIndexes
      .filter((index) => Number.isInteger(index) && index >= 0 && index < words.length)
      .map((index) => {
        const answerWord = words[index];
        return {
          index,
          answerWord,
          masked: words.map((word, wordIndex) => wordIndex === index ? "______" : word).join(" ")
        };
      });

    if (candidates.length === 0) {
      return null;
    }

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    const constraint = VOCAB_PROMPT_CONSTRAINTS[entry.term.toLowerCase()];
    const title = constraint
      ? `뜻풀이를 보고 빈칸에 들어갈 영어 어휘를 쓰시오. 조건: ${constraint}`
      : "뜻풀이를 보고 빈칸에 들어갈 영어 어휘를 쓰시오.";
    const blocks = [
      buildMeaningBlock(entry),
      { label: "빈칸", value: chosen.masked }
    ];

    return {
      mode: "korean",
      prompt: { title, blocks },
      answer: chosen.answerWord.toLowerCase(),
      acceptedAnswers: [normalizeAnswer(chosen.answerWord)],
      displayAnswer: chosen.answerWord
    };
  }

  function buildVocabularyImagePrompt(entry, imageInfo) {
    const constraint = VOCAB_PROMPT_CONSTRAINTS[entry.term.toLowerCase()];
    const baseTitle = imageInfo.type === "plain"
      ? "그림과 관련된 어휘는?"
      : imageInfo.type === "numbered"
        ? `${imageInfo.number}번에 들어갈 어휘는?`
        : "?에 들어갈 단어는?";
    const title = constraint
      ? `${baseTitle} 조건: ${constraint}`
      : baseTitle;

    return {
      title,
      blocks: [
        {
          label: "이미지",
          type: "image",
          src: imageInfo.src,
          alt: `${entry.term} 관련 이미지`
        }
      ]
    };
  }

  function buildVocabularyImageQuestionConfig(entry, imageInfo, allowCombiningVowel) {
    const override = ((VOCAB_IMAGE_PROMPT_OVERRIDES[entry.term.toLowerCase()] || {})[imageInfo.type]) || null;
    const defaultConfig = {
      prompt: buildVocabularyImagePrompt(entry, imageInfo),
      answer: entry.answer,
      acceptedAnswers: getAcceptedAnswers(entry, allowCombiningVowel),
      displayAnswer: entry.term
    };

    if (!override) {
      return defaultConfig;
    }

    return {
      prompt: {
        title: override.title,
        blocks: [
          {
            label: "이미지",
            type: "image",
            src: imageInfo.src,
            alt: override.alt || `${entry.term} 관련 이미지`
          }
        ]
      },
      answer: override.answer || entry.answer,
      acceptedAnswers: override.acceptedAnswers || getAcceptedAnswers(entry, allowCombiningVowel),
      displayAnswer: override.displayAnswer || entry.term
    };
  }

  function buildMeaningBlock(entryLike) {
    const choices = [];

    if (entryLike.korean) {
      choices.push({
        label: "한국어 대응어",
        value: entryLike.korean,
        small: true
      });
    }

    if (hasUsableEnglishClue(entryLike)) {
      choices.push({
        label: "영어 설명",
        value: entryLike.english,
        small: true
      });
    }

    if (choices.length === 0) {
      return {
        label: "\uB2E8\uC11C",
        value: "표시할 단서가 없습니다.",
        small: true
      };
    }

    return choices[Math.floor(Math.random() * choices.length)];
  }

  function hasUsableEnglishClue(entryLike) {
    if (!entryLike || !entryLike.english) {
      return false;
    }

    const english = normalizeClueKey(entryLike.english);
    const sourceWord = normalizeClueKey(entryLike.word || entryLike.term || "");

    if (!english) {
      return false;
    }

    if (!sourceWord) {
      return true;
    }

    return english !== sourceWord;
  }

  function normalizeClueKey(text) {
    return cleanupDisplay(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  function normalizeMorphologyKey(text) {
    return cleanupDisplay(text || "").toLowerCase();
  }

  function getMorphologyBucketName(type) {
    if (type === "root") {
      return "roots";
    }

    if (type === "suffix") {
      return "suffixes";
    }

    if (type === "prefix") {
      return "prefixes";
    }

    return null;
  }

  function getAllowedMorphologyTerms(vocabularyEntry, type) {
    if (!vocabularyEntry || !vocabularyEntry.morphology) {
      return null;
    }

    const bucketName = getMorphologyBucketName(type);
    if (!bucketName || !Object.prototype.hasOwnProperty.call(vocabularyEntry.morphology, bucketName)) {
      return null;
    }

    return (vocabularyEntry.morphology[bucketName] || []).map((term) => normalizeMorphologyKey(term));
  }

  function isAllowedMorphologyCandidate(entry, vocabularyEntry) {
    const allowedTerms = getAllowedMorphologyTerms(vocabularyEntry, entry.type);
    if (allowedTerms === null) {
      return false;
    }

    return allowedTerms.includes(normalizeMorphologyKey(entry.term));
  }

  function buildClozePrompt(entry, vocabularyEntries, scopeConfig, categoryTerms, scopedTerms) {
    const candidates = vocabularyEntries
      .filter((item) => introducedInScope(item.term, scopeConfig))
      .map((item) => makeBlank(entry, item, categoryTerms, scopedTerms))
      .filter(Boolean);

    if (candidates.length === 0) {
      return null;
    }

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    const vocabConstraint = entry.type === "suffix"
      ? ""
      : VOCAB_PROMPT_CONSTRAINTS[(chosen.word || "").toLowerCase()];
    const title = vocabConstraint
      ? `전체 어휘의 빈칸을 보고 ${CATEGORY_LABELS[entry.type]}를 쓰시오. 조건: ${vocabConstraint}`
      : `전체 어휘의 빈칸을 보고 ${CATEGORY_LABELS[entry.type]}를 쓰시오.`;

    return {
      title,
      blocks: [
        buildMeaningBlock(chosen),
        { label: "\uBE48\uCE78", value: chosen.masked }
      ],
      word: chosen.word
    };
  }

  function introducedInScope(term, scopeConfig) {
    const selectedWeekSet = new Set(scopeConfig.weeks);
    return data.weeks
      .filter((weekInfo) => selectedWeekSet.has(weekInfo.week))
      .some((weekInfo) => weekInfo.items.vocabulary.some((item) => item.toLowerCase() === term.toLowerCase()));
  }

  function makeBlank(entry, vocabularyEntry, categoryTerms, scopedTerms) {
    const sourceWord = vocabularyEntry.term;
    const lowerWord = sourceWord.toLowerCase();
    const target = entry.answer.toLowerCase();

    if (!target) {
      return null;
    }

    if (!isAllowedMorphologyCandidate(entry, vocabularyEntry)) {
      return null;
    }

    let startIndex = -1;

    if (entry.type === "prefix") {
      if (!lowerWord.startsWith(target)) {
        return null;
      }
      if (hasBetterPrefixMatch(entry, lowerWord, categoryTerms, scopedTerms)) {
        return null;
      }
      if (hasLongerRootStartingAtPrefix(lowerWord, target.length, scopedTerms)) {
        return null;
      }
      startIndex = 0;
    } else if (entry.type === "suffix") {
      if (!lowerWord.endsWith(target)) {
        return null;
      }
      if (hasLongerAffixMatch(entry, lowerWord, categoryTerms, scopedTerms)) {
        return null;
      }
      startIndex = lowerWord.length - target.length;
    } else {
      startIndex = lowerWord.indexOf(target);
    }

    if (startIndex < 0) {
      return null;
    }

    if (entry.type === "root") {
      if (overlapsPlausibleAffix(entry, lowerWord, startIndex, target.length, scopedTerms)) {
        return null;
      }

      if (hasLongerRootOverlap(entry, lowerWord, startIndex, target.length, categoryTerms)) {
        return null;
      }
    }

    const masked = maskWord(sourceWord, startIndex, target.length);
    if (masked === sourceWord) {
      return null;
    }

    return {
      word: sourceWord,
      masked,
      english: vocabularyEntry.english,
      korean: vocabularyEntry.korean
    };
  }

  function hasLongerAffixMatch(entry, lowerWord, categoryTerms, scopedTerms) {
    if (!Array.isArray(categoryTerms) || (entry.type !== "prefix" && entry.type !== "suffix")) {
      return false;
    }

    const target = entry.answer.toLowerCase();

    return categoryTerms.some((term) => {
      const otherEntry = getEntry(term);
      if (!otherEntry || otherEntry.type !== entry.type) {
        return false;
      }

      const other = otherEntry.answer.toLowerCase();
      if (other === target || other.length <= target.length) {
        return false;
      }

      if (entry.type === "prefix") {
        if (!lowerWord.startsWith(other)) {
          return false;
        }

        const remainder = lowerWord.slice(other.length);
        return fragmentCanStartAfterPrefix(remainder, scopedTerms);
      }

      if (!lowerWord.endsWith(other)) {
        return false;
      }

      const remainder = lowerWord.slice(0, lowerWord.length - other.length);
      return fragmentCanEndBeforeSuffix(remainder, scopedTerms);
    });
  }

  function hasBetterPrefixMatch(entry, lowerWord, categoryTerms, scopedTerms) {
    if (!Array.isArray(categoryTerms) || entry.type !== "prefix") {
      return false;
    }

    const currentScore = getPrefixMatchScore(entry, lowerWord, scopedTerms);
    if (!currentScore) {
      return false;
    }

    return categoryTerms.some((term) => {
      const otherEntry = getEntry(term);
      if (!otherEntry || otherEntry.type !== "prefix") {
        return false;
      }

      const otherScore = getPrefixMatchScore(otherEntry, lowerWord, scopedTerms);
      if (!otherScore) {
        return false;
      }

      if (otherScore.key === currentScore.key) {
        return false;
      }

      if (otherScore.plausible !== currentScore.plausible) {
        return otherScore.plausible && !currentScore.plausible;
      }

      return otherScore.length > currentScore.length;
    });
  }

  function getPrefixMatchScore(entry, lowerWord, scopedTerms) {
    if (!entry || entry.type !== "prefix") {
      return null;
    }

    const target = entry.answer.toLowerCase();
    if (!lowerWord.startsWith(target)) {
      return null;
    }

    const remainder = lowerWord.slice(target.length);
    return {
      key: entry.term.toLowerCase(),
      plausible: fragmentCanStartAfterPrefix(remainder, scopedTerms),
      length: target.length
    };
  }

  function overlapsPlausibleAffix(entry, lowerWord, startIndex, length, scopedTerms) {
    const endIndex = startIndex + length;

    return getPlausibleAffixRanges(lowerWord, scopedTerms).some((range) => {
      return range.start < endIndex && startIndex < range.end;
    });
  }

  function getPlausibleAffixRanges(lowerWord, scopedTerms) {
    const ranges = [];

    scopedTerms.prefixes.forEach((term) => {
      const entry = getEntry(term);
      if (!entry) {
        return;
      }

      const target = entry.answer.toLowerCase();
      if (!lowerWord.startsWith(target)) {
        return;
      }

      const remainder = lowerWord.slice(target.length);
      if (!fragmentCanStartAfterPrefix(remainder, scopedTerms)) {
        return;
      }

      ranges.push({ start: 0, end: target.length });
    });

    scopedTerms.suffixes.forEach((term) => {
      const entry = getEntry(term);
      if (!entry) {
        return;
      }

      const target = entry.answer.toLowerCase();
      if (!lowerWord.endsWith(target)) {
        return;
      }

      const remainder = lowerWord.slice(0, lowerWord.length - target.length);
      if (!fragmentCanEndBeforeSuffix(remainder, scopedTerms)) {
        return;
      }

      ranges.push({ start: lowerWord.length - target.length, end: lowerWord.length });
    });

    return ranges;
  }

  function hasLongerRootOverlap(entry, lowerWord, startIndex, length, categoryTerms) {
    if (!Array.isArray(categoryTerms) || entry.type !== "root") {
      return false;
    }

    const endIndex = startIndex + length;
    const target = entry.answer.toLowerCase();

    return categoryTerms.some((term) => {
      const otherEntry = getEntry(term);
      if (!otherEntry || otherEntry.type !== "root") {
        return false;
      }

      const other = otherEntry.answer.toLowerCase();
      if (other === target || other.length <= target.length) {
        return false;
      }

      let searchStart = 0;
      while (searchStart < lowerWord.length) {
        const otherStart = lowerWord.indexOf(other, searchStart);
        if (otherStart < 0) {
          return false;
        }

        const otherEnd = otherStart + other.length;
        if (otherStart < endIndex && startIndex < otherEnd) {
          return true;
        }

        searchStart = otherStart + 1;
      }

      return false;
    });
  }

  function hasLongerRootStartingAtPrefix(lowerWord, prefixLength, scopedTerms) {
    return scopedTerms.roots.some((term) => {
      const entry = getEntry(term);
      if (!entry) {
        return false;
      }

      const target = entry.answer.toLowerCase();
      return target.length > prefixLength && lowerWord.startsWith(target);
    });
  }

  function fragmentCanStartAfterPrefix(fragment, scopedTerms) {
    if (!fragment) {
      return false;
    }

    return scopedTerms.roots.some((term) => {
      const entry = getEntry(term);
      return entry && fragment.startsWith(entry.answer.toLowerCase());
    }) || scopedTerms.suffixes.some((term) => {
      const entry = getEntry(term);
      return entry && fragment.startsWith(entry.answer.toLowerCase());
    });
  }

  function fragmentCanEndBeforeSuffix(fragment, scopedTerms) {
    if (!fragment) {
      return false;
    }

    return scopedTerms.roots.some((term) => {
      const entry = getEntry(term);
      if (!entry) {
        return false;
      }

      const target = entry.answer.toLowerCase();
      return fragment.endsWith(target) || fragment.endsWith(`${target}o`) || fragment.endsWith(`${target}i`) || fragment.endsWith(`${target}a`) || fragment.endsWith(`${target}e`);
    }) || scopedTerms.prefixes.some((term) => {
      const entry = getEntry(term);
      return entry && fragment.endsWith(entry.answer.toLowerCase());
    });
  }

  function maskWord(word, startIndex, length) {
    const blank = "______";
    return `${word.slice(0, startIndex)}${blank}${word.slice(startIndex + length)}`;
  }

  function renderQuestion() {
    clearTimer();
    clearAdvanceTimer();
    state.locked = false;
    state.remainingSeconds = 25;
    timerText.textContent = String(state.remainingSeconds);
    if (examTimerText) {
      examTimerText.textContent = `${state.remainingSeconds}초`;
    }
    feedback.textContent = "";
    feedback.className = "feedback";
    nextButton.classList.add("hidden");
    state.examAnswerDraft = "";
    answerInput.value = "";
    answerInput.disabled = false;
    submitButton.disabled = false;
    skipButton.disabled = false;
    if (examAnswerVisibilityCheckbox) {
      examAnswerVisibilityCheckbox.checked = false;
    }
    syncExamAnswerVisibility();

    const question = state.questions[state.currentIndex];
    const total = state.questions.length;

    progressText.textContent = `${state.currentIndex + 1} / ${total}`;
    progressFill.style.width = `${((state.currentIndex + 1) / total) * 100}%`;
    metaWeek.textContent = question.week;
    metaCategory.textContent = CATEGORY_LABELS[question.category];
    metaMode.textContent = MODE_LABELS[question.mode];
    if (examSessionMeta) {
      examSessionMeta.textContent = `${question.week}주차 · ${CATEGORY_LABELS[question.category]} · ${MODE_LABELS[question.mode]} · ${state.currentIndex + 1}/${total}`;
    }
    if (isExamLayout()) {
      questionTitle.innerHTML = `
        <span class="exam-question-number">${state.currentIndex + 1}</span>
        <span class="exam-question-text">/${total}. ${cleanupDisplay(question.prompt.title)}</span>
      `;
    } else {
      questionTitle.textContent = question.prompt.title;
    }
    if (answerLabel) {
      answerLabel.textContent = isExamLayout() ? "\uB2F5 1" : "\uC815\uB2F5 \uC785\uB825";
    }
    submitButton.textContent = isExamLayout() ? "답안 전송" : "제출";
    questionBody.innerHTML = "";

    question.prompt.blocks.forEach((block) => {
      const container = document.createElement("section");
      container.className = "question-block";

      if (block.type === "image") {
        container.classList.add("question-block-image");
      }

      const label = document.createElement("span");
      label.className = "question-label";
      label.textContent = block.label;
      container.appendChild(label);

      if (block.type === "image") {
        const frame = document.createElement("div");
        frame.className = "question-image-frame";

        const image = document.createElement("img");
        image.className = "question-image";
        image.src = block.src;
        image.alt = block.alt || "문항 이미지";
        image.loading = "eager";

        frame.appendChild(image);
        container.appendChild(frame);
      } else {
        const value = document.createElement("div");
        value.className = `question-value${block.small ? " question-small" : ""}`;
        value.textContent = cleanupDisplay(block.value);
        container.appendChild(value);
      }

      questionBody.appendChild(container);
    });

    answerInput.focus();
    startTimer();
  }

  function cleanupDisplay(text) {
    return String(text)
      .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
      .replace(/\[\[([^\]]+)\]\]/g, "$1")
      .replace(/[*`]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function startTimer() {
    timerText.textContent = String(state.remainingSeconds);
    if (examTimerText) {
      examTimerText.textContent = `${state.remainingSeconds}초`;
    }
    state.timerId = window.setInterval(() => {
      state.remainingSeconds -= 1;
      timerText.textContent = String(state.remainingSeconds);
      if (examTimerText) {
        examTimerText.textContent = `${state.remainingSeconds}초`;
      }

      if (state.remainingSeconds <= 0) {
        submitAnswer(true);
      }
    }, 1000);
  }

  function clearTimer() {
    if (state.timerId) {
      window.clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function clearAdvanceTimer() {
    if (state.advanceTimerId) {
      window.clearTimeout(state.advanceTimerId);
      state.advanceTimerId = null;
    }
  }

  function submitAnswer(isTimeout, isSkip) {
    if (state.locked) {
      return;
    }

    clearTimer();
    state.locked = true;

    const question = state.questions[state.currentIndex];
    const userInput = isTimeout || isSkip ? "" : getCurrentAnswerValue();
    const isCorrect = !isTimeout && !isSkip && isAnswerCorrect(question, userInput);

    if (isCorrect) {
      state.score += 1;
      scoreText.textContent = String(state.score);
      if (!isExamLayout()) {
        feedback.className = "feedback ok";
        feedback.textContent = `정답입니다.\n정답: ${question.displayAnswer}`;
      }
    } else {
      const reason = isTimeout ? "\uC2DC\uAC04 \uCD08\uACFC" : isSkip ? "\uAC74\uB108\uB700" : "\uC624\uB2F5";
      if (!isExamLayout()) {
        feedback.className = "feedback bad";
        feedback.textContent = `${reason}\n정답: ${question.displayAnswer}${userInput ? `\n내 답: ${userInput}` : ""}`;
      }
      state.missed.push({
        question,
        userInput: userInput || (isTimeout ? "\uC2DC\uAC04 \uCD08\uACFC" : "\uAC74\uB108\uB700")
      });
    }

    answerInput.disabled = true;
    submitButton.disabled = true;
    skipButton.disabled = true;
    nextButton.classList.add("hidden");
    state.advanceTimerId = window.setTimeout(() => {
      state.advanceTimerId = null;
      goToNextQuestion();
    }, isExamLayout() ? 120 : 450);
  }

  function goToNextQuestion() {
    if (state.currentIndex + 1 >= state.questions.length) {
      showResults();
      return;
    }

    state.currentIndex += 1;
    renderQuestion();
  }

  function showResults() {
    clearTimer();
    clearAdvanceTimer();
    quizPanel.classList.add("hidden");
    resultPanel.classList.remove("hidden");
    applyLayoutMode();
    syncViewState();

    const total = state.questions.length;
    const accuracy = total === 0 ? 0 : Math.round((state.score / total) * 100);

    resultSummary.textContent = `${state.score} / ${total} 정답 · 정답률 ${accuracy}%`;
    resultStats.innerHTML = "";

    [
      { label: "\uC804\uCCB4 \uBB38\uC81C \uC218", value: total },
      { label: "\uB9DE\uD78C \uBB38\uC81C \uC218", value: state.score },
      { label: "\uD2C0\uB9B0 \uBB38\uC81C \uC218", value: total - state.score }
    ].forEach((item) => {
      const card = document.createElement("article");
      card.className = "stat-card";
      card.innerHTML = `<span>${item.label}</span><strong>${item.value}</strong>`;
      resultStats.appendChild(card);
    });

    missedList.innerHTML = "";
    if (state.missed.length === 0) {
      const card = document.createElement("article");
      card.className = "missed-card";
      card.innerHTML = "<h3>오답이 없습니다.</h3><p>모든 문제를 맞혔습니다.</p>";
      missedList.appendChild(card);
      return;
    }

    state.missed.forEach((item, index) => {
      const card = document.createElement("article");
      card.className = "missed-card";
      card.innerHTML = `
        <h3>${index + 1}. ${CATEGORY_LABELS[item.question.category]} · ${MODE_LABELS[item.question.mode]}</h3>
        <p>문제: ${item.question.prompt.title}</p>
        <p>정답: ${item.question.displayAnswer}</p>
        <p>내 답: ${cleanupDisplay(item.userInput)}</p>
      `;
      missedList.appendChild(card);
    });
  }

  function resetToSetup() {
    clearTimer();
    clearAdvanceTimer();
    resultPanel.classList.add("hidden");
    quizPanel.classList.add("hidden");
    setupPanel.classList.remove("hidden");
    applyLayoutMode();
    syncViewState();
  }

  function normalize(value) {
    return String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  function shuffle(list) {
    const cloned = list.slice();

    for (let index = cloned.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]];
    }

    return cloned;
  }
})();
