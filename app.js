(function () {
  const data = window.MEDICAL_ENGLISH_QUIZ_DATA;

  if (!data) {
    document.body.innerHTML = "<main class=\"app-shell\"><section class=\"panel\"><h1>데이터를 불러오지 못했습니다.</h1><p>`quiz-data.js`가 있는지 확인해주세요.</p></section></main>";
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
    korean: "한국어 뜻",
    definition: "영어 뜻풀이",
    gloss: "영어 풀이",
    cloze: "빈칸"
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
    "-ium",
    "-logy",
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
    "non-",
    "un-"
  ]);

  const GLOSS_PROMPT_CONSTRAINTS = {
    "-osis": "정답에 알파벳 o를 포함하시오.",
    "-iasis": "정답에 알파벳 a를 포함하시오.",
    "-dynia": "정답에 알파벳 d를 포함하시오.",
    "-algia": "정답에 알파벳 g를 포함하시오.",
    "opt(o)": "정답에 알파벳 h를 포함하지 마시오.",
    "ophthalm(o)": "정답에 알파벳 h를 포함하시오.",
    "cutane(o)": "정답에 알파벳 c를 포함하시오.",
    "dermat(o)": "정답에 알파벳 d를 포함하시오.",
    "hem(o)": "정답에 알파벳 t를 포함하지 마시오.",
    "hemat(o)": "정답에 알파벳 t를 포함하시오.",
    "muscul(o)": "정답에 알파벳 u를 포함하시오.",
    "my(o)": "정답에 알파벳 y를 포함하시오."
  };

  const VOCAB_PROMPT_CONSTRAINTS = {
    "hypodermic": "정답에 알파벳 h를 포함하시오.",
    "subcutaneous": "정답에 알파벳 s를 포함하시오."
  };

  Object.assign(VOCAB_PROMPT_CONSTRAINTS, {
    "gastralgia": "정답에 알파벳 d를 포함하지 마시오.",
    "gastrodynia": "정답에 알파벳 d를 포함하시오.",
    "thoracentesis": "정답에 연속 알파벳 co를 포함하지 마시오.",
    "thoracocentesis": "정답에 연속 알파벳 co를 포함하시오.",
    "hematopoiesis": "정답에 알파벳 t를 포함하시오.",
    "hemopoiesis": "정답에 알파벳 t를 포함하지 마시오.",
    "membraneous": "정답에 연속 알파벳 eo를 포함하시오.",
    "membranous": "정답에 연속 알파벳 eo를 포함하지 마시오.",
    "polydactylia": "정답을 알파벳 a로 끝내시오.",
    "polydactyly": "정답을 알파벳 y로 끝내시오.",
    "subglossal": "정답에 알파벳 i를 포함하지 마시오.",
    "sublingual": "정답에 알파벳 i를 포함하시오.",
    "trachea": "정답에 알파벳 t를 포함하시오.",
    "windpipe": "정답에 알파벳 w를 포함하시오."
  });

  Object.assign(GLOSS_PROMPT_CONSTRAINTS, {
    "-osis": "정답에 알파벳 o를 포함하시오.",
    "-iasis": "정답에 알파벳 a를 포함하시오.",
    "-dynia": "정답에 알파벳 d를 포함하시오.",
    "-algia": "정답에 알파벳 g를 포함하시오.",
    "opt(o)": "정답에 알파벳 h를 포함하지 마시오.",
    "ophthalm(o)": "정답에 알파벳 h를 포함하시오.",
    "cutane(o)": "정답에 알파벳 c를 포함하시오.",
    "dermat(o)": "정답에 알파벳 d를 포함하시오.",
    "hem(o)": "정답에 알파벳 t를 포함하지 마시오.",
    "hemat(o)": "정답에 알파벳 t를 포함하시오.",
    "muscul(o)": "정답에 알파벳 u를 포함하시오.",
    "my(o)": "정답에 알파벳 y를 포함하시오.",
    "con-": "정답에 알파벳 c를 포함하시오.",
    "syn-": "정답에 알파벳 s를 포함하시오.",
    "anti-": "정답에 알파벳 c를 포함하지 마시오.",
    "contra-": "정답에 알파벳 c를 포함하시오.",
    "hypo-": "정답에 알파벳 h를 포함하시오.",
    "sub-": "정답에 알파벳 s를 포함하시오.",
    "hyper-": "정답에 알파벳 h를 포함하시오.",
    "supra-": "정답에 알파벳 s를 포함하시오.",
    "ante-": "정답에 알파벳 a를 포함하시오.",
    "pro-": "정답에 알파벳 p를 포함하시오."
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
  const listSummary = document.getElementById("list-summary");
  const listDetail = document.getElementById("list-detail");
  const listDetailBackdrop = document.getElementById("list-detail-backdrop");
  const listDetailTitle = document.getElementById("list-detail-title");
  const listDetailContent = document.getElementById("list-detail-content");
  const listDetailCloseButton = document.getElementById("list-detail-close");
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

    startButton.addEventListener("click", startQuiz);
    openListButton.addEventListener("click", openListView);
    closeListButton.addEventListener("click", closeListView);
    submitButton.addEventListener("click", () => submitAnswer(false));
    skipButton.addEventListener("click", () => submitAnswer(false, true));
    nextButton.addEventListener("click", goToNextQuestion);
    restartButton.addEventListener("click", resetToSetup);
    rangeModeSelect.addEventListener("change", handleRangeModeChange);
    weekSelect.addEventListener("change", syncListViewIfOpen);
    questionCountSelect.addEventListener("change", updateQuestionCountUI);
    listCategoryFilter.addEventListener("change", syncListViewIfOpen);
    customWeekOptions.addEventListener("change", syncListViewIfOpen);
    customQuestionCountInput.addEventListener("input", syncListViewIfOpen);
    if (examAnswerVisibilityCheckbox) {
      examAnswerVisibilityCheckbox.addEventListener("change", syncExamAnswerVisibility);
    }
    if (listDetailBackdrop) {
      listDetailBackdrop.addEventListener("click", handleListDetailClose);
    }
    if (listDetailCloseButton) {
      listDetailCloseButton.addEventListener("click", handleListDetailClose);
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
      }
    });
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
      summary.push(`미등록 항목 ${missingCount}개 제외`);
    }

    dataSummary.textContent = summary.join(" · ");
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
        window.alert("선택 주차 모드에서는 최소 한 주차를 골라주세요.");
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
        window.alert("직접 입력 문제 수는 1 이상의 정수로 입력해주세요.");
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
        return "선택 주차 없음";
      }

      return `선택 주차 ${scopeConfig.weeks.map((week) => `${week}주차`).join(", ")}`;
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
    const selectedModes = Array.from(document.querySelectorAll(".mode-groups input[type=\"checkbox\"]:checked"))
      .map((element) => element.value);
    const scopeConfig = getScopeConfig(true);
    const allowCombiningVowel = rootAllowCombiningVowelCheckbox.checked;

    if (!scopeConfig) {
      return;
    }

    if (selectedModes.length === 0) {
      window.alert("최소 한 가지 문제 유형은 선택해주세요.");
      return;
    }

    let questions = buildQuestionPool(scopeConfig, selectedModes, allowCombiningVowel);
    if (questions.length === 0) {
      window.alert("현재 선택으로 만들 수 있는 문제가 없습니다.");
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

  function buildQuestionPool(scopeConfig, selectedModes, allowCombiningVowel) {
    const scopedTerms = getScopedTerms(scopeConfig);
    const vocabularyTerms = scopedTerms.vocabulary;
    const morphologyVocabulary = vocabularyTerms
      .map((term) => getEntry(term))
      .filter(Boolean);
    const selectedModeSet = new Set(selectedModes);
    const questions = [];

    vocabularyTerms.forEach((term) => {
      if (!selectedModeSet.has("vocabulary:korean")) {
        return;
      }

      const entry = getEntry(term);
      if (!entry || (!entry.korean && !entry.english)) {
        return;
      }

      const promptInfo = buildVocabularyPrompt(entry);

      questions.push({
        id: `vocabulary:korean:${entry.term}`,
        week: findIntroducedWeek(entry.term, "vocabulary", scopeConfig),
        category: "vocabulary",
        mode: promptInfo.mode,
        term: entry.term,
        prompt: promptInfo.prompt,
        answer: entry.answer,
        acceptedAnswers: getAcceptedAnswers(entry, allowCombiningVowel),
        displayAnswer: entry.term
      });
    });

    ["root", "suffix", "prefix"].forEach((category) => {
      scopedTerms[CATEGORY_BUCKETS[category]].forEach((term) => {
        const entry = getEntry(term);
        if (!entry) {
          return;
        }

        if (selectedModeSet.has(`${category}:gloss`) && entry.english && !isClozeOnlyTerm(entry)) {
          const glossPrompt = buildMorphologyGlossPrompt(entry);
          questions.push({
            id: `${category}:gloss:${entry.term}`,
            week: findIntroducedWeek(entry.term, CATEGORY_BUCKETS[category], scopeConfig),
            category,
            mode: "gloss",
            term: entry.term,
            prompt: glossPrompt,
            answer: entry.answer,
            acceptedAnswers: getAcceptedAnswers(entry, allowCombiningVowel),
            displayAnswer: entry.answer
          });
        }

        if (selectedModeSet.has(`${category}:cloze`)) {
          const cloze = buildClozePrompt(entry, morphologyVocabulary, scopeConfig, scopedTerms[CATEGORY_BUCKETS[category]], scopedTerms);
          if (!cloze) {
            return;
          }

          questions.push({
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
          });
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
      ? "전체 범주"
      : CATEGORY_LABELS[categoryFilter];

    listSummary.textContent = `${rangeLabel} · ${categoryLabel} · ${totalCount}개 항목`;
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
      listDetailTitle.textContent = "뜻 보기";
      listDetailContent.innerHTML = "<p class=\"muted\">뜻 정보를 찾지 못했습니다.</p>";
      listDetail.classList.remove("hidden");
      listDetail.setAttribute("aria-hidden", "false");
      return;
    }

    const blocks = [];
    if (entry.korean) {
      blocks.push({ label: "한국어", value: entry.korean });
    }
    if (hasUsableEnglishClue(entry)) {
      blocks.push({ label: entry.type === "vocabulary" ? "영어 뜻풀이" : "영어 풀이", value: entry.english });
    }

    if (blocks.length === 0) {
      blocks.push({ label: "뜻", value: "정의 없음" });
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

    listDetailTitle.textContent = getListDisplayTerm(entry.term);
    listDetailContent.innerHTML = `<div class="list-detail-grid">${body}</div>`;
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

    return match ? `${match.week}주차` : "범위 외";
  }

  function buildMorphologyGlossPrompt(entry) {
    const constraint = GLOSS_PROMPT_CONSTRAINTS[entry.term.toLowerCase()];
    const title = constraint
      ? `${CATEGORY_LABELS[entry.type]}의 영어 풀이를 보고 맞히세요. 조건: ${constraint}`
      : `${CATEGORY_LABELS[entry.type]}의 영어 풀이를 보고 맞히세요.`;

    return {
      title,
      blocks: [
        { label: "영어 풀이", value: entry.english }
      ]
    };
  }

  function buildVocabularyPrompt(entry) {
    const constraint = VOCAB_PROMPT_CONSTRAINTS[entry.term.toLowerCase()];
    const title = constraint
      ? `뜻에 맞는 영어 어휘를 쓰세요. 조건: ${constraint}`
      : "뜻에 맞는 영어 어휘를 쓰세요.";
    const choices = [];

    if (entry.korean) {
      choices.push({
        mode: "korean",
        prompt: {
          title,
          blocks: [
            { label: "한국어", value: entry.korean }
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
            { label: "영어 뜻풀이", value: entry.english }
          ]
        }
      });
    }

    return choices[Math.floor(Math.random() * choices.length)];
  }

  function buildMeaningBlock(entryLike) {
    const choices = [];

    if (entryLike.korean) {
      choices.push({
        label: "한국어",
        value: entryLike.korean,
        small: true
      });
    }

    if (hasUsableEnglishClue(entryLike)) {
      choices.push({
        label: "영어 뜻풀이",
        value: entryLike.english,
        small: true
      });
    }

    if (choices.length === 0) {
      return {
        label: "뜻풀이",
        value: "정의 없음",
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

  function buildClozePrompt(entry, vocabularyEntries, scopeConfig, categoryTerms, scopedTerms) {
    const candidates = vocabularyEntries
      .filter((item) => introducedInScope(item.term, scopeConfig))
      .map((item) => makeBlank(entry, item, categoryTerms, scopedTerms))
      .filter(Boolean);

    if (candidates.length === 0) {
      return null;
    }

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    const blocks = [
      buildMeaningBlock(chosen),
      { label: "빈칸", value: chosen.masked }
    ];

    return {
      title: `${CATEGORY_LABELS[entry.type]}가 들어갈 자리를 맞히세요.`,
      blocks,
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
      examSessionMeta.textContent = `${question.week} · ${CATEGORY_LABELS[question.category]} · ${MODE_LABELS[question.mode]} · ${state.currentIndex + 1}/${total}`;
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
      answerLabel.textContent = isExamLayout() ? "답 1" : "정답 입력";
    }
    submitButton.textContent = isExamLayout() ? "답안 전송" : "제출";
    questionBody.innerHTML = "";

    question.prompt.blocks.forEach((block) => {
      const container = document.createElement("section");
      container.className = "question-block";

      const label = document.createElement("span");
      label.className = "question-label";
      label.textContent = block.label;
      container.appendChild(label);

      const value = document.createElement("div");
      value.className = `question-value${block.small ? " question-small" : ""}`;
      value.textContent = cleanupDisplay(block.value);
      container.appendChild(value);

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
      const reason = isTimeout ? "시간 종료" : isSkip ? "건너뜀" : "오답";
      if (!isExamLayout()) {
        feedback.className = "feedback bad";
        feedback.textContent = `${reason}\n정답: ${question.displayAnswer}${userInput ? `\n입력: ${userInput}` : ""}`;
      }
      state.missed.push({
        question,
        userInput: userInput || (isTimeout ? "시간 초과" : "미입력")
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
      { label: "총 문제 수", value: total },
      { label: "맞힌 문제", value: state.score },
      { label: "틀린 문제", value: total - state.score }
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
      card.innerHTML = "<h3>틀린 문제가 없습니다.</h3><p>현재 선택한 범위는 모두 맞혔습니다.</p>";
      missedList.appendChild(card);
      return;
    }

    state.missed.forEach((item, index) => {
      const promptLines = item.question.prompt.blocks
        .map((block) => `${block.label}: ${cleanupDisplay(block.value)}`)
        .join("<br>");

      const card = document.createElement("article");
      card.className = "missed-card";
      card.innerHTML = `
        <h3>${index + 1}. ${CATEGORY_LABELS[item.question.category]} · ${MODE_LABELS[item.question.mode]}</h3>
        <p>문제: ${item.question.prompt.title}</p>
        <p>${promptLines}</p>
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
