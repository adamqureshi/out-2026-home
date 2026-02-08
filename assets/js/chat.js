(() => {
  const cfg = (window.OUT_CONFIG && window.OUT_CONFIG.chat) ? window.OUT_CONFIG.chat : {};
  const links = (window.OUT_CONFIG && window.OUT_CONFIG.links) ? window.OUT_CONFIG.links : {};

  const chat = document.getElementById("chatWidget");
  const fab = document.querySelector(".chat-fab");
  const closeBtn = document.querySelector("[data-close-chat]");
  const logEl = document.getElementById("chatLog");
  const quickEl = document.getElementById("chatQuickReplies");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");

  if (!chat || !logEl || !quickEl || !form || !input) return;

  const state = {
    open: false,
    step: "start",
    intent: null,
    data: {}
  };

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[c]));
  }

  function addMessage(role, text) {
    const wrap = document.createElement("div");
    wrap.className = `msg msg--${role}`;
    wrap.innerHTML = `<div class="msg__bubble">${escapeHtml(text)}</div>`;
    logEl.appendChild(wrap);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function addCard(title, lines, actions = []) {
    const wrap = document.createElement("div");
    wrap.className = "msg msg--bot";
    const actionsHtml = actions.map((a) => {
      const isBtn = a.type === "button";
      if (isBtn) {
        return `<button class="btn btn-secondary btn--small" type="button" data-action="${escapeHtml(a.action)}">${escapeHtml(a.label)}</button>`;
      }
      const target = a.target ? ` target="${escapeHtml(a.target)}"` : "";
      return `<a class="btn btn-secondary btn--small" href="${escapeHtml(a.href)}"${target} rel="noreferrer noopener">${escapeHtml(a.label)}</a>`;
    }).join("");

    wrap.innerHTML = `
      <div class="msg__bubble msg__bubble--card">
        <div class="cardline cardline--title">${escapeHtml(title)}</div>
        ${lines.map((l) => `<div class="cardline">${escapeHtml(l)}</div>`).join("")}
        ${actionsHtml ? `<div class="cardactions">${actionsHtml}</div>` : ""}
      </div>
    `;
    logEl.appendChild(wrap);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function setQuickReplies(items) {
    quickEl.innerHTML = "";
    if (!items || !items.length) return;

    items.forEach((label) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = label;
      btn.addEventListener("click", () => handleUser(label, true));
      quickEl.appendChild(btn);
    });
  }

  function normalize(text) {
    return (text || "").toString().trim();
  }

  function isVin(text) {
    const t = text.toUpperCase().replace(/\s+/g, "");
    return /^[A-HJ-NPR-Z0-9]{11,17}$/.test(t);
  }

  function cannedAnswer(text) {
    const t = text.toLowerCase();

    if (t.includes("warranty") || t.includes("supercharg") || t.includes("transfer")) {
      return "Warranty & perks can change. Best move: call Tesla with the VIN (seller on the line) and ask what transfers.";
    }
    if (t.includes("inspection") || t.includes("mechanic")) {
      return "Recommended: independent inspection (or Tesla service inspection) before you travel/finalize.";
    }
    if (t.includes("escrow") || t.includes("payout") || t.includes("pay out")) {
      return "PAY-OUT (escrow-style checkout) is in progress but not live yet. Today we connect buyers & sellers.";
    }
    if (t.includes("privacy") || t.includes("data")) {
      return "We do not sell your personal information to data brokers. We charge simple fees instead.";
    }
    if (t.includes("price") || t.includes("expensive") || t.includes("market value")) {
      return "Sellers set prices; buyers negotiate. Our focus is bringing Tesla-specific buyers to the listing.";
    }
    if (t.includes("scam") || t.includes("safe")) {
      return "Use common sense like any private sale: verify VIN, talk on the phone, meet safely, and use secure payment methods.";
    }
    return null;
  }

  function listingSummaryLines() {
    const d = state.data;
    return [
      `Model: ${d.model || "-"}`,
      `Year: ${d.year || "-"}`,
      `Mileage: ${d.miles || "-"}`,
      `Location: ${d.location || "-"}`,
      `Asking price: ${d.price || "(optional)"}`
    ];
  }

  function cashOfferSummaryLines() {
    const d = state.data;
    return [
      `Model: ${d.model || "-"}`,
      `Year: ${d.year || "-"}`,
      `Mileage: ${d.miles || "-"}`,
      `Location: ${d.location || "-"}`
    ];
  }

  async function maybeAskApi(message) {
    const url = cfg.apiUrl;
    if (!url) return null;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context: { intent: state.intent, data: state.data } })
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || !data.reply) return null;
      return data;
    } catch (_) {
      return null;
    }
  }

  function startConversation() {
    addMessage("bot", "Hi — what do you want to do today?");
    setQuickReplies([
      "Create a listing",
      "Buy OUT-CHECK ($20)",
      "Get a cash offer",
      "Shop used Teslas"
    ]);
    state.step = "start";
    state.intent = null;
    state.data = {};
  }

  async function handleUser(text, fromQuickReply = false) {
    const msg = normalize(text);
    if (!msg) return;

    addMessage("user", msg);
    if (!fromQuickReply) input.value = "";

    // If we're mid-flow, continue the wizard
    if (state.step === "start") {
      if (/listing/i.test(msg)) {
        state.intent = "listing";
        state.step = "listing_model";
        addMessage("bot", "Nice. What model are you selling?");
        setQuickReplies(["Model 3", "Model Y", "Model S", "Model X", "Cybertruck", "Other"]);
        return;
      }

      if (/out-check|report|vin/i.test(msg)) {
        state.intent = "outcheck";
        state.step = "outcheck_vin";
        addMessage("bot", "OUT-CHECK is $20. Paste the VIN (11–17 chars) if you have it.");
        setQuickReplies(["I don’t have the VIN yet", "Buy OUT-CHECK ($20)"]);
        return;
      }

      if (/cash/i.test(msg)) {
        state.intent = "cash_offer";
        state.step = "offer_model";
        addMessage("bot", "Let’s do it. What model is it?");
        setQuickReplies(["Model 3", "Model Y", "Model S", "Model X", "Cybertruck", "Other"]);
        return;
      }

      if (/shop|browse|buy/i.test(msg)) {
        state.intent = "shop";
        state.step = "done";
        addCard("Shop inventory", [
          "Browse private + dealer listings.",
          "Tip: run OUT-CHECK before you travel."
        ], [
          { type: "link", label: "Shop used Teslas", href: links.shop || "#" },
          { type: "link", label: "Buy OUT-CHECK ($20)", href: links.outCheck || "#" }
        ]);
        setQuickReplies(["Create a listing", "Get a cash offer"]);
        return;
      }

      // If the user typed a question instead of choosing an intent
      const canned = cannedAnswer(msg);
      if (canned) {
        addMessage("bot", canned);
        setQuickReplies(["Create a listing", "Buy OUT-CHECK ($20)", "Get a cash offer", "Shop used Teslas"]);
        return;
      }

      // Optional AI endpoint
      const api = await maybeAskApi(msg);
      if (api) {
        addMessage("bot", api.reply);
        setQuickReplies(api.quickReplies || ["Create a listing", "Buy OUT-CHECK ($20)", "Get a cash offer"]);
        return;
      }

      addMessage("bot", "I can help with: listing, OUT-CHECK, cash offer, or shopping. Tap one below.");
      setQuickReplies(["Create a listing", "Buy OUT-CHECK ($20)", "Get a cash offer", "Shop used Teslas"]);
      return;
    }

    // LISTING flow
    if (state.intent === "listing") {
      if (state.step === "listing_model") {
        state.data.model = msg;
        state.step = "listing_year";
        addMessage("bot", "What year is it?");
        setQuickReplies(["2024", "2023", "2022", "2021", "2020", "Other"]);
        return;
      }

      if (state.step === "listing_year") {
        state.data.year = msg;
        state.step = "listing_miles";
        addMessage("bot", "Approx mileage?");
        setQuickReplies(["< 25k", "25–50k", "50–100k", "100k+"]);
        return;
      }

      if (state.step === "listing_miles") {
        state.data.miles = msg;
        state.step = "listing_location";
        addMessage("bot", "Where is the car located? (city/state or postcode)");
        setQuickReplies([]);
        return;
      }

      if (state.step === "listing_location") {
        state.data.location = msg;
        state.step = "listing_price";
        addMessage("bot", "Asking price? (optional — you can skip)");
        setQuickReplies(["Skip"]);
        return;
      }

      if (state.step === "listing_price") {
        if (!/^skip$/i.test(msg)) state.data.price = msg;
        state.step = "done";
        addCard("Listing draft (copy/paste)", listingSummaryLines(), [
          { type: "link", label: "Continue to listing checkout", href: links.sellListing || "#" },
          { type: "button", label: "Copy summary", action: "copy_listing" }
        ]);
        addMessage("bot", "Listings start at $27. You’ll finish details + photos on the next step.");
        setQuickReplies(["Buy OUT-CHECK ($20)", "Get a cash offer"]);
        return;
      }
    }

    // OUT-CHECK flow
    if (state.intent === "outcheck") {
      if (state.step === "outcheck_vin") {
        if (/don’t have|dont have|no vin/i.test(msg)) {
          addMessage("bot", "No worries. Ask the seller for the VIN. Meanwhile you can bookmark the OUT-CHECK checkout.");
          addCard("OUT-CHECK ($20)", [
            "You’ll need the VIN to run the report.",
            "Takes ~2 minutes once you have it."
          ], [
            { type: "link", label: "Buy OUT-CHECK ($20)", href: links.outCheck || "#" }
          ]);
          setQuickReplies(["Create a listing", "Get a cash offer", "Shop used Teslas"]);
          state.step = "done";
          return;
        }

        if (/buy/i.test(msg)) {
          addCard("OUT-CHECK ($20)", [
            "You’ll need the VIN to run the report."
          ], [
            { type: "link", label: "Buy OUT-CHECK ($20)", href: links.outCheck || "#" }
          ]);
          setQuickReplies(["Paste VIN"]);
          return;
        }

        if (isVin(msg)) {
          state.data.vin = msg.toUpperCase().replace(/\s+/g, "");
          state.step = "done";
          addCard("Ready for OUT-CHECK", [
            `VIN: ${state.data.vin}`,
            "Next: complete checkout."
          ], [
            { type: "link", label: "Buy OUT-CHECK ($20)", href: links.outCheck || "#" },
            { type: "button", label: "Copy VIN", action: "copy_vin" }
          ]);
          setQuickReplies(["Create a listing", "Get a cash offer", "Shop used Teslas"]);
          return;
        }

        const canned = cannedAnswer(msg);
        if (canned) {
          addMessage("bot", canned);
          setQuickReplies(["Paste VIN", "Buy OUT-CHECK ($20)"]);
          return;
        }

        addMessage("bot", "That doesn’t look like a VIN. If you have it, paste the VIN (11–17 chars).");
        setQuickReplies(["I don’t have the VIN yet", "Buy OUT-CHECK ($20)"]);
        return;
      }
    }

    // CASH OFFER flow
    if (state.intent === "cash_offer") {
      if (state.step === "offer_model") {
        state.data.model = msg;
        state.step = "offer_year";
        addMessage("bot", "What year?");
        setQuickReplies(["2024", "2023", "2022", "2021", "2020", "Other"]);
        return;
      }

      if (state.step === "offer_year") {
        state.data.year = msg;
        state.step = "offer_miles";
        addMessage("bot", "Approx mileage?");
        setQuickReplies(["< 25k", "25–50k", "50–100k", "100k+"]);
        return;
      }

      if (state.step === "offer_miles") {
        state.data.miles = msg;
        state.step = "offer_location";
        addMessage("bot", "Where are you located? (city/state or postcode)");
        setQuickReplies([]);
        return;
      }

      if (state.step === "offer_location") {
        state.data.location = msg;
        state.step = "done";
        addCard("Cash offer (dealer funded)", cashOfferSummaryLines(), [
          { type: "link", label: "Start cash offer", href: links.cashOffer || "#" },
          { type: "button", label: "Copy summary", action: "copy_offer" }
        ]);
        addMessage("bot", "Submit once and compare offers. No obligation.");
        setQuickReplies(["Buy OUT-CHECK ($20)", "Create a listing", "Shop used Teslas"]);
        return;
      }
    }

    // If we got here, treat as general question
    const canned = cannedAnswer(msg);
    if (canned) {
      addMessage("bot", canned);
      setQuickReplies(["Create a listing", "Buy OUT-CHECK ($20)", "Get a cash offer", "Shop used Teslas"]);
      state.step = "start";
      state.intent = null;
      state.data = {};
      return;
    }

    const api = await maybeAskApi(msg);
    if (api) {
      addMessage("bot", api.reply);
      setQuickReplies(api.quickReplies || ["Create a listing", "Buy OUT-CHECK ($20)", "Get a cash offer"]);
      return;
    }

    addMessage("bot", "I might be missing that. Want to create a listing, buy OUT-CHECK, or get a cash offer?");
    setQuickReplies(["Create a listing", "Buy OUT-CHECK ($20)", "Get a cash offer", "Shop used Teslas"]);
    state.step = "start";
    state.intent = null;
    state.data = {};
  }

  // Action buttons inside cards
  logEl.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    if (!action) return;

    if (action === "copy_listing") {
      const text = listingSummaryLines().join("\n");
      try {
        await navigator.clipboard.writeText(text);
        addMessage("bot", "Copied. Paste that into your listing notes if helpful.");
      } catch (_) {
        addMessage("bot", "Couldn’t copy automatically. You can screenshot the summary.");
      }
    }

    if (action === "copy_offer") {
      const text = cashOfferSummaryLines().join("\n");
      try {
        await navigator.clipboard.writeText(text);
        addMessage("bot", "Copied. Paste that into your cash-offer form if helpful.");
      } catch (_) {
        addMessage("bot", "Couldn’t copy automatically. You can screenshot the summary.");
      }
    }

    if (action === "copy_vin") {
      const vin = state.data.vin || "";
      try {
        await navigator.clipboard.writeText(vin);
        addMessage("bot", "VIN copied.");
      } catch (_) {
        addMessage("bot", "Couldn’t copy automatically.");
      }
    }
  });

  function open() {
    if (state.open) return;
    chat.hidden = false;
    state.open = true;

    // First time only
    if (logEl.children.length === 0) {
      startConversation();
    }

    // Focus input on open
    setTimeout(() => input.focus(), 50);
  }

  function close() {
    if (!state.open) return;
    chat.hidden = true;
    state.open = false;
    if (fab) fab.focus();
  }

  // Public API
  window.OUT_CHAT = { open, close };

  // Bind UI
  if (fab) fab.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleUser(input.value, false);
  });
})();
