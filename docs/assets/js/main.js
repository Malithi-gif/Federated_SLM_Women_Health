/* FedSLM · Women's Health — page interactions (no dependencies) */
(function () {
  "use strict";

  /* ---------- theme toggle ---------- */
  const root = document.documentElement;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };
  const saved = store.get("theme");
  if (saved === "dark" || saved === "light") root.setAttribute("data-theme", saved);
  const isDark = () => root.getAttribute("data-theme") === "dark" ||
    (!root.hasAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelector(".theme-toggle")?.addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", next);
    store.set("theme", next);
  });

  /* ---------- Table 1: feature–phase association ---------- */
  // p = 0 encodes "< 10^-300" (below floating-point precision; reported as 0 by the test).
  const FEATURES = [
    { f: "PdG",            t: "Numerical",   p: 0 },
    { f: "Estrogen",       t: "Numerical",   p: 1.53e-135 },
    { f: "LH",             t: "Numerical",   p: 7.07e-113 },
    { f: "Flow volume",    t: "Categorical", p: 0 },
    { f: "Flow color",     t: "Categorical", p: 0 },
    { f: "Cramps",         t: "Categorical", p: 9.92e-81 },
    { f: "Sore breasts",   t: "Categorical", p: 1.11e-41 },
    { f: "Bloating",       t: "Categorical", p: 3.46e-19 },
    { f: "Indigestion",    t: "Categorical", p: 2.23e-7 },
    { f: "Headaches",      t: "Categorical", p: 2.32e-7 },
    { f: "Mood swings",     t: "Categorical", p: 3.73e-6 },
    { f: "Food cravings",  t: "Categorical", p: 4.97e-4 },
    { f: "Sleep issues",    t: "Categorical", p: 9.60e-3 },
    { f: "Fatigue",        t: "Categorical", p: 1.24e-2 },
    { f: "Appetite",       t: "Categorical", p: 6.83e-2 },
    { f: "Exercise level", t: "Categorical", p: 7.28e-2 },
    { f: "Stress",         t: "Categorical", p: 2.26e-1 }
  ];

  const SUP = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  const sup = s => String(s).split("").map(c => SUP[c] || c).join("");
  function fmtP(p) {
    if (p === 0) return "< 10⁻³⁰⁰";
    if (p >= 1e-3) return p.toPrecision(3).replace(/\.?0+$/, "");
    const e = Math.floor(Math.log10(p));
    const m = (p / Math.pow(10, e)).toFixed(2);
    return `${m} × 10${sup(e)}`;
  }

  function renderChart() {
    const host = document.getElementById("sig-chart");
    if (!host) return;
    const NS = "http://www.w3.org/2000/svg";
    const W = 560, labelW = 112, valW = 92, rowH = 25, top = 8, axisH = 26;
    const plotW = W - labelW - valW;
    const H = top + FEATURES.length * rowH + axisH;
    // x = log10(-log10 p) mapped from domain [0.5, 250]
    const dMin = Math.log10(0.5), dMax = Math.log10(250);
    const x = v => labelW + ((Math.log10(Math.min(Math.max(v, 0.5), 250)) - dMin) / (dMax - dMin)) * plotW;
    const nlp = p => (p === 0 ? 250 : -Math.log10(p));

    function setSci(node, p) {
      if (p === 0) {
        node.appendChild(document.createTextNode("< 10"));
        const t0 = document.createElementNS(NS, "tspan");
        t0.setAttribute("dy", "-4"); t0.setAttribute("dx", "2"); t0.setAttribute("class", "exp"); t0.textContent = "−300";
        node.appendChild(t0); return;
      }
      if (p >= 1e-3) { node.textContent = fmtP(p); return; }
      const e = Math.floor(Math.log10(p));
      node.appendChild(document.createTextNode(`${(p / Math.pow(10, e)).toFixed(2)} × 10`));
      const t = document.createElementNS(NS, "tspan");
      t.setAttribute("dy", "-4"); t.setAttribute("dx", "2"); t.setAttribute("class", "exp"); t.textContent = "−" + Math.abs(e);
      node.appendChild(t);
    }
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Horizontal bar chart of feature association with menstrual phase. 14 of 17 features are significant at p < 0.05; appetite, exercise level and stress are not.");
    const el = (name, attrs, parent) => {
      const n = document.createElementNS(NS, name);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      (parent || svg).appendChild(n);
      return n;
    };

    // grid + ticks (labelled as p-values)
    const ticks = [{ v: 1, e: 1 }, { v: 10, e: 10 }, { v: 100, e: 100 }];
    const y0 = top, y1 = top + FEATURES.length * rowH;
    ticks.forEach(t => {
      el("line", { x1: x(t.v), x2: x(t.v), y1: y0, y2: y1, class: "gridline" });
      const tx = el("text", { x: x(t.v), y: y1 + 18, "text-anchor": "middle", class: "tick" });
      tx.appendChild(document.createTextNode("p = 10"));
      const ts = el("tspan", { dy: -4, class: "exp" }, tx); ts.textContent = "−" + t.e;
    });

    const tip = host.parentElement.querySelector(".tooltip");
    FEATURES.forEach((d, i) => {
      const sig = d.p < 0.05;
      const g = el("g", { class: "row", tabindex: "0", "aria-label": `${d.f}: p ${fmtP(d.p)}, ${sig ? "significant" : "not significant"}` });
      const cy = top + i * rowH;
      el("rect", { x: 0, y: cy, width: W, height: rowH, class: "hit", rx: 4 }, g);
      const lbl = el("text", { x: labelW - 10, y: cy + rowH / 2 + 4, "text-anchor": "end", class: "lbl" }, g);
      lbl.textContent = d.f;
      const bx0 = labelW, bx1 = x(nlp(d.p)), bh = 12, by = cy + (rowH - bh) / 2, r = 4;
      const w = Math.max(bx1 - bx0, r + 1);
      el("path", {
        d: `M${bx0},${by} h${w - r} a${r},${r} 0 0 1 ${r},${r} v${bh - 2 * r} a${r},${r} 0 0 1 ${-r},${r} h${-(w - r)} z`,
        class: "bar" + (sig ? "" : " ns")
      }, g);
      const val = el("text", { x: bx0 + w + 8, y: cy + rowH / 2 + 4, class: "val" }, g);
      setSci(val, d.p);

      const show = (cx, cyy) => {
        if (!tip) return;
        tip.innerHTML = `<b>${d.f}</b> <span class="tt-sub">· ${d.t}</span><br>p ${d.p === 0 ? "< 10⁻³⁰⁰ (below precision)" : "= " + fmtP(d.p)} · ${sig ? "significant" : "not significant"}`;
        tip.hidden = false;
        const box = host.parentElement.getBoundingClientRect();
        let left = cx - box.left + 14, topPx = cyy - box.top - 10;
        const tw = tip.offsetWidth;
        if (left + tw > box.width - 8) left = cx - box.left - tw - 14;
        tip.style.left = left + "px";
        tip.style.top = topPx + "px";
      };
      g.addEventListener("mousemove", e => show(e.clientX, e.clientY));
      g.addEventListener("mouseleave", () => { if (tip) tip.hidden = true; });
      g.addEventListener("focus", () => { const b = g.getBoundingClientRect(); show(b.left + b.width * 0.55, b.top + b.height / 2); });
      g.addEventListener("blur", () => { if (tip) tip.hidden = true; });
    });

    // threshold line drawn on top
    el("line", { x1: x(1.30103), x2: x(1.30103), y1: y0 - 4, y2: y1, class: "thresh" });

    host.appendChild(svg);

    // table view
    const tbody = document.querySelector("#sig-table tbody");
    if (tbody) {
      tbody.innerHTML = FEATURES.map(d =>
        `<tr><td>${d.f}</td><td>${d.t}</td><td>${d.p === 0 ? "< 10⁻³⁰⁰ †" : fmtP(d.p)}</td><td>${d.p < 0.05 ? "Yes" : "No"}</td></tr>`
      ).join("");
    }
  }

  // chart / table tabs
  document.querySelectorAll(".viz-root .seg[role=tablist]").forEach(seg => {
    const card = seg.closest(".viz-root");
    seg.addEventListener("click", e => {
      const b = e.target.closest("button[data-view]");
      if (!b) return;
      seg.querySelectorAll("button").forEach(x => x.setAttribute("aria-selected", String(x === b)));
      card.querySelectorAll("[data-view-panel]").forEach(p => { p.hidden = p.dataset.viewPanel !== b.dataset.view; });
      const legend = card.querySelector(".viz-legend");
      if (legend) legend.hidden = b.dataset.view !== "chart";
    });
  });

  /* ---------- Table 3: generated feedback examples ---------- */
  const EXAMPLES = [
    ["Qwen", 1, "Menstrual", "Menstrual", "The pattern suggests a transition after menstruation. Cramps seem notable; consider gentle self-care."],
    ["Qwen", 2, "Follicular", "Follicular", "The pattern suggests you are likely in the follicular phase. Your body is preparing for potential ovulation."],
    ["Qwen", 3, "Menstrual", "Menstrual", "The pattern suggests a transition into the menstrual phase. Your body is preparing for menstruation."],
    ["Qwen", 4, "Luteal", "Luteal", "The pattern suggests you are in the luteal phase. Your body seems to be preparing for a potential menstrual period."],
    ["Qwen", 6, "Menstrual", "Menstrual", "The pattern suggests a transition into the menstrual phase. Bleeding-related changes may be starting."],
    ["Qwen", 7, "Follicular", "Follicular", "The pattern suggests you are in the follicular phase. Your symptoms align with this time of your cycle."],
    ["Qwen", 8, "Luteal", "Luteal", "The luteal phase can be associated with changes in energy levels. Your current pattern may reflect typical luteal phase-related changes."],
    ["Qwen", 9, "Luteal", "Luteal", "The pattern suggests you are in the luteal phase. Hormone-related changes may be contributing to your pattern."],
    ["Qwen", 10, "Follicular", "Follicular", "The pattern suggests you are likely in your follicular phase. Your body seems to be preparing for potential ovulation."],
    ["Qwen", 11, "Follicular", "Follicular", "The pattern suggests you are likely in the follicular phase. Your symptoms seem to align with this time of your cycle."],
    ["Phi-3", 12, "Follicular", "Follicular", "The reported pattern is most consistent with the follicular phase. Hormone-related changes may be contributing to the pattern."],
    ["Phi-3", 20, "Menstrual", "Menstrual", "The reported pattern is consistent with the menstrual phase. Cramps may be contributing to discomfort."],
    ["Phi-3", 26, "Luteal", "Luteal", "The reported pattern is most consistent with the luteal phase. Breast tenderness may be relevant."],
    ["Phi-3", 27, "Menstrual", "Menstrual", "It appears you may be experiencing typical menstrual-related discomfort. Headache relief strategies may help."],
    ["Phi-3", 33, "Follicular", "Follicular", "The reported pattern is most consistent with the follicular phase. Hormone-related changes may be contributing to the pattern."],
    ["Phi-3", 38, "Luteal", "Luteal", "The reported pattern is most consistent with the luteal phase. Fatigue may be contributing to discomfort."],
    ["Phi-3", 41, "Menstrual", "Menstrual", "The reported pattern is consistent with the menstrual phase. Cramps may be contributing to discomfort."],
    ["Phi-3", 42, "Luteal", "Luteal", "It appears you may be experiencing bloating common in the luteal phase. Fatigue may be contributing to sleep issues."],
    ["Phi-3", 47, "Follicular", "Follicular", "The reported pattern is most consistent with the follicular phase. Hormone-related changes may be contributing to the pattern."],
    ["Phi-3", 50, "Menstrual", "Menstrual", "The reported pattern is consistent with the menstrual phase. Fatigue may be contributing to sleep issues."]
  ].map(([model, user, truth, pred, text]) => ({ model, user, truth, pred, text }));

  // Imprecise responses the paper calls out explicitly (Section 4.1.1).
  const FLAGS = {
    "Qwen-1": "Describes \u201ca transition after menstruation\u201d for a record in the menstrual phase.",
    "Qwen-3": "States the body \u201cis preparing for menstruation\u201d for a menstrual-phase record."
  };

  const state = { model: "all", phase: "all" };
  function renderExamples() {
    const grid = document.getElementById("examples-grid");
    if (!grid) return;
    const rows = EXAMPLES.filter(e =>
      (state.model === "all" || e.model === state.model) &&
      (state.phase === "all" || e.truth === state.phase));
    grid.innerHTML = rows.map((e, i) => {
      const cls = "ph-" + e.pred.toLowerCase();
      return `<article class="ex ${cls}" style="animation-delay:${Math.min(i, 10) * 25}ms">
        <div class="ex-meta"><span class="ex-model">${e.model}</span><span>User ${e.user}</span></div>
        <p class="ex-quote">${e.text}</p>
        ${FLAGS[e.model + "-" + e.user] ? `<p class="ex-flag"><b>Imprecise:</b> ${FLAGS[e.model + "-" + e.user]}</p>` : ""}
        <div class="ex-foot"><span class="chip ${cls}">${e.pred}</span><span>true: ${e.truth}</span>${e.truth === e.pred ? '<span class="match" title="Prediction matches the true phase">✓ correct</span>' : ""}</div>
      </article>`;
    }).join("");
    const c = document.getElementById("example-count");
    if (c) c.textContent = `${rows.length} of ${EXAMPLES.length} examples`;
  }
  function bindFilter(id, key) {
    const seg = document.getElementById(id);
    if (!seg) return;
    seg.addEventListener("click", ev => {
      const b = ev.target.closest("button");
      if (!b) return;
      seg.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      state[key] = b.dataset[key];
      renderExamples();
    });
  }
  bindFilter("model-filter", "model");
  bindFilter("phase-filter", "phase");

  /* ---------- copy BibTeX ---------- */
  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const src = document.querySelector(btn.dataset.copy);
      if (!src) return;
      try {
        await navigator.clipboard.writeText(src.textContent);
        btn.textContent = "Copied";
      } catch (e) {
        const r = document.createRange(); r.selectNodeContents(src);
        const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        btn.textContent = "Selected";
      }
      setTimeout(() => { btn.textContent = "Copy"; }, 1600);
    });
  });

  renderChart();
  renderExamples();
})();
