const $ = (sel) => document.querySelector(sel);

function getSavedUser() {
  try {
    const raw = localStorage.getItem("lc_user");
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function getUserName() {
  const saved = getSavedUser();
  const input = $("#username");
  const val = input && input.value ? input.value.trim() : "";
  return val || (saved && saved.name) || "Guest";
}

function ensureUsernameInput() {
  const saved = getSavedUser();
  const input = $("#username");
  if (input && saved && !input.value) input.value = saved.name;
}

async function postJSON(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

async function postForm(url, formData) {
  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

// Progress chart (optional per page)
let chartCanvas = null;
(function initChartIfPresent() {
  const table = $("#progressTable");
  if (!table) return;
  chartCanvas = document.createElement("canvas");
  chartCanvas.width = 800;
  chartCanvas.height = 200;
  chartCanvas.style.width = "100%";
  table.parentElement.appendChild(chartCanvas);
})();

function drawChart(rows) {
  if (!chartCanvas) return;
  const ctx = chartCanvas.getContext("2d");
  ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
  if (!rows.length) return;
  const padding = 24;
  const w = chartCanvas.width - padding * 2;
  const h = chartCanvas.height - padding * 2;
  const values = rows.map((r) => r.wer ?? 0);
  const max = Math.max(1, ...values);
  ctx.strokeStyle = "#ccc";
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, padding + h);
  ctx.lineTo(padding + w, padding + h);
  ctx.stroke();
  ctx.strokeStyle = "#1976d2";
  ctx.beginPath();
  rows.forEach((_, i) => {
    const x = padding + (i / (rows.length - 1 || 1)) * w;
    const y = padding + (1 - values[i] / max) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

async function refreshProgress() {
  const table = $("#progressTable tbody");
  if (!table) return; // page without progress
  const userName = getUserName();
  const rows = await getJSON(
    `/api/progress/results?user_name=${encodeURIComponent(userName)}`
  );
  table.innerHTML = "";
  for (const r of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${new Date(r.created_at).toLocaleString()}</td><td>${
      r.language
    }</td><td>${r.grammar_issues_count}</td><td>${r.wer ?? ""}</td>`;
    table.appendChild(tr);
  }
  drawChart(rows.slice().reverse());
}

async function submitProgress({
  grammarIssuesCount,
  wer,
  substitutions,
  deletions,
  insertions,
  inputText,
}) {
  const payload = {
    user_name: getUserName(),
    language: $("#language") ? $("#language").value || "en-US" : "en-US",
    input_text: inputText ?? null,
    grammar_issues_count: grammarIssuesCount ?? 0,
    wer: wer ?? null,
    substitutions: substitutions ?? null,
    deletions: deletions ?? null,
    insertions: insertions ?? null,
  };
  try {
    await postJSON("/api/progress/results", payload);
    await refreshProgress();
  } catch (e) {
    console.error(e);
  }
}

function renderGrammarIssues(issues, text) {
  const container = $("#grammarOut");
  if (!container) return;
  if (!issues || !issues.length) {
    container.innerHTML =
      '<div class="issue"><div class="message">No issues found.</div></div>';
    return;
  }
  const items = issues.map((m, idx) => {
    const start = Math.max(0, m.offset);
    const end = Math.min(text.length, m.offset + m.length);
    const snippet = text.slice(start, end) || "(selection)";
    const suggestion =
      m.replacements && m.replacements.length
        ? ` <span class=\"suggestion\">Try: \"${m.replacements[0]}\"</span>`
        : "";
    return `<div class=\"issue\"><div class=\"snippet\">${snippet}</div><div class=\"message\">${
      idx + 1
    }. ${m.message}${suggestion}</div></div>`;
  });
  container.innerHTML = items.join("");
}

// Word-level alignment (Levenshtein DP) and rendering
function alignWords(ref, hyp) {
  const r = ref.trim().split(/\s+/);
  const h = hyp.trim().split(/\s+/);
  const n = r.length,
    m = h.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) dp[i][0] = i;
  for (let j = 1; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = r[i - 1].toLowerCase() === h[j - 1].toLowerCase() ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  const aligned = [];
  let i = n,
    j = m;
  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      dp[i][j] ===
        dp[i - 1][j - 1] +
          (r[i - 1].toLowerCase() === h[j - 1].toLowerCase() ? 0 : 1)
    ) {
      const ok = r[i - 1].toLowerCase() === h[j - 1].toLowerCase();
      aligned.push({ ref: r[i - 1], hyp: h[j - 1], error: ok ? "ok" : "sub" });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      aligned.push({ ref: r[i - 1], hyp: null, error: "del" });
      i--;
    } else {
      aligned.push({ ref: null, hyp: h[j - 1], error: "ins" });
      j--;
    }
  }
  aligned.reverse();
  return aligned;
}
function renderWordMistakes(ref, hyp) {
  const c = document.querySelector("#wordMistakes");
  if (!c) return;
  if (!ref.trim() && !hyp.trim()) {
    c.innerHTML = "";
    return;
  }
  const aligned = alignWords(ref, hyp);
  c.innerHTML = aligned
    .map((a) => {
      if (a.error === "ok") return `<span class="tag ok">${a.hyp}</span>`;
      if (a.error === "sub")
        return `<span class="tag sub">${a.hyp} → ${a.ref}</span>`;
      if (a.error === "ins") return `<span class="tag ins">+ ${a.hyp}</span>`;
      return `<span class="tag del">- ${a.ref}</span>`;
    })
    .join(" ");
}

function renderInsights(ref, hyp, measures) {
  const c = document.querySelector("#pronInsights");
  if (!c) return;
  const rWords = ref.trim() ? ref.trim().split(/\s+/).length : 0;
  const hWords = hyp.trim() ? hyp.trim().split(/\s+/).length : 0;
  const wer = measures?.wer ?? null;
  const subs = measures?.substitutions ?? 0;
  const dels = measures?.deletions ?? 0;
  const ins = measures?.insertions ?? 0;
  const accPct = wer != null ? Math.max(0, 100 - wer * 100).toFixed(1) : null;
  const lines = [];
  lines.push(
    `<div class="issue"><div class="message">Recognized: "${
      hyp || ""
    }"</div></div>`
  );
  if (accPct !== null)
    lines.push(
      `<div class="issue"><div class="message">Accuracy: ${accPct}% (WER ${(
        wer * 100
      ).toFixed(1)}%)</div></div>`
    );
  lines.push(
    `<div class="issue"><div class="message">Words: Ref ${rWords}, You ${hWords}</div></div>`
  );
  lines.push(
    `<div class="issue"><div class="message">Errors — Sub: ${subs}, Del: ${dels}, Ins: ${ins}</div></div>`
  );
  c.innerHTML = lines.join("");
}

// TTS helpers
function splitIntoPhrases(text) {
  const parts = text.split(/([.!?]+)\s+/).reduce((acc, cur, idx, arr) => {
    if (!cur) return acc;
    if (/[.!?]+/.test(cur)) {
      const last = acc.pop() || "";
      acc.push((last + cur).trim());
    } else {
      acc.push(cur.trim());
    }
    return acc;
  }, []);
  return parts.filter(Boolean);
}
function speak(text, lang) {
  try {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang =
      lang ||
      (document.querySelector("#language")
        ? document.querySelector("#language").value
        : "en-US");
    window.speechSynthesis.speak(utter);
  } catch (_) {
    /* no-op */
  }
}
async function speakPhrasesSequential(text, lang) {
  try {
    const phrases = splitIntoPhrases(text);
    for (const p of phrases) {
      await new Promise((resolve) => {
        const u = new SpeechSynthesisUtterance(p);
        u.lang =
          lang ||
          (document.querySelector("#language")
            ? document.querySelector("#language").value
            : "en-US");
        u.onend = resolve;
        window.speechSynthesis.speak(u);
      });
    }
  } catch (_) {
    /* no-op */
  }
}

// Bind handlers conditionally per page
(function bindGrammar() {
  const btn = $("#checkBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    ensureUsernameInput();
    const text = $("#text").value;
    const language = $("#language").value || "en-US";
    const out = $("#grammarOut");
    if (out)
      out.innerHTML =
        '<div class="issue"><div class="message">Checking...</div></div>';
    try {
      const res = await postJSON("/api/grammar/check", { text, language });
      const issues = res.issues || [];
      renderGrammarIssues(issues, text);
      await submitProgress({
        grammarIssuesCount: issues.length,
        inputText: text,
      });
    } catch (e) {
      if (out)
        out.innerHTML = `<div class="issue"><div class="message">Error: ${e.message}</div></div>`;
    }
  });
})();

let recognition;
let recoActive = false;
let recoTranscript = "";
function getRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert("Web Speech API not supported in this browser.");
    return null;
  }
  const r = new SR();
  r.lang = $("#language") ? $("#language").value || "en-US" : "en-US";
  r.interimResults = true;
  r.continuous = true;
  return r;
}

(function bindPronunciation() {
  const start = $("#startReco");
  const stop = $("#stopReco");
  const score = $("#scoreBtn");
  const status = $("#micStatus");
  const playRef = $("#playRef");
  if (!start || !stop || !score) return;

  if (playRef) {
    playRef.addEventListener("click", () => {
      const text = (document.querySelector("#ref")?.value || "").trim();
      const lang = document.querySelector("#language")?.value || "en-US";
      if (text) {
        speakPhrasesSequential(text, lang);
      }
    });
  }

  start.addEventListener("click", () => {
    ensureUsernameInput();
    if (recoActive) return;
    recognition = getRecognition();
    if (!recognition) return;
    if (status) {
      status.textContent = "Microphone active...";
      status.classList.add("active");
      status.classList.remove("stopped");
    }
    recoTranscript = "";
    recognition.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript;
      }
      if (finalText) {
        recoTranscript += " " + finalText;
        $("#hyp").value = recoTranscript.trim();
      }
    };
    recognition.onend = () => {
      recoActive = false;
      if (status) {
        status.textContent = "Microphone stopped";
        status.classList.remove("active");
        status.classList.add("stopped");
      }
      stop.disabled = true;
      const lang = document.querySelector("#language")?.value || "en-US";
      const hyp = (document.querySelector("#hyp")?.value || "").trim();
      const ref = (document.querySelector("#ref")?.value || "").trim();
      renderWordMistakes(ref, hyp);
      renderInsights(ref, hyp, null);
      if (hyp) {
        speak(hyp, lang);
      }
      if (ref) {
        speakPhrasesSequential(ref, lang);
      }
    };
    recognition.onerror = () => {
      recoActive = false;
      if (status) {
        status.textContent = "Microphone error";
        status.classList.remove("active");
        status.classList.add("stopped");
      }
      stop.disabled = true;
    };
    recognition.start();
    recoActive = true;
    stop.disabled = false;
  });

  stop.addEventListener("click", () => {
    if (recognition && recoActive) recognition.stop();
  });

  score.addEventListener("click", async () => {
    const reference_text = $("#ref").value || "";
    const hypothesis_text = $("#hyp").value || "";
    const language = $("#language") ? $("#language").value || "en-US" : "en-US";
    $("#pronOut").textContent = "Scoring...";
    try {
      const res = await postJSON("/api/pronunciation/score", {
        reference_text,
        hypothesis_text,
        language,
      });
      $("#pronOut").textContent = JSON.stringify(res, null, 2);
      renderWordMistakes(reference_text, hypothesis_text);
      renderInsights(reference_text, hypothesis_text, res);
      await submitProgress({
        wer: res.wer,
        substitutions: res.substitutions,
        deletions: res.deletions,
        insertions: res.insertions,
        inputText: hypothesis_text,
      });
    } catch (e) {
      $("#pronOut").textContent = "Error: " + e.message;
    }
  });
})();

// ASR upload handler (optional page)
(function bindASR() {
  const btn = $("#asrUpload");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    ensureUsernameInput();
    const fileInput = $("#asrFile");
    const f = fileInput.files && fileInput.files[0];
    if (!f) {
      $("#asrOut").textContent = "Please select an audio file.";
      return;
    }
    const fd = new FormData();
    fd.append("file", f);
    fd.append(
      "language",
      $("#language") ? $("#language").value || "en-US" : "en-US"
    );
    fd.append("provider", "none");
    $("#asrOut").textContent = "Uploading...";
    try {
      const res = await postForm("/api/asr/transcribe", fd);
      $("#asrOut").textContent = JSON.stringify(res, null, 2);
    } catch (e) {
      $("#asrOut").textContent = "Error: " + e.message;
    }
  });
})();

// Phoneme conversion (optional page)
(function bindPhonemes() {
  const btn = $("#phonBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    ensureUsernameInput();
    const text = $("#phonInput").value || "";
    const language = (
      $("#language") ? $("#language").value || "en-US" : "en-US"
    ).toLowerCase();
    $("#phonOut").textContent = "Converting...";
    try {
      const res = await postJSON("/api/phonemes/to_phonemes", {
        text,
        language,
      });
      $("#phonOut").textContent = res.phonemes.join(" ");
    } catch (e) {
      $("#phonOut").textContent = "Error: " + e.message;
    }
  });
})();

// Alignment (optional page)
(function bindAlignment() {
  const btn = $("#alignBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    ensureUsernameInput();
    const refPhon = $("#refPhon").value.trim().split(/\s+/).filter(Boolean);
    const hypPhon = $("#hypPhon").value.trim().split(/\s+/).filter(Boolean);
    $("#alignOut").textContent = "Aligning...";
    try {
      const res = await postJSON("/api/alignment/align", {
        reference_phonemes: refPhon,
        hypothesis_phonemes: hypPhon,
        distance: "levenshtein",
      });
      $("#alignOut").textContent = JSON.stringify(res, null, 2);
    } catch (e) {
      $("#alignOut").textContent = "Error: " + e.message;
    }
  });
})();

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  ensureUsernameInput();
  refreshProgress().catch(() => {});
});
