(() => {
  const cfg = (window.OUT_CONFIG && window.OUT_CONFIG.auth) ? window.OUT_CONFIG.auth : {};
  const $ = (sel, root = document) => root.querySelector(sel);

  function toast(message) {
    // Lightweight inline toast. Avoids dependencies.
    let el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("toast--show");
    window.clearTimeout(window.__toastTimer);
    window.__toastTimer = window.setTimeout(() => el.classList.remove("toast--show"), 3200);
  }

  // Google OAuth
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-auth-google]");
    if (!btn) return;

    const url = cfg.googleStartUrl || "";
    if (!url) {
      toast("Google sign-in URL not configured yet.");
      return;
    }

    const returnTo = window.location.pathname + window.location.search + window.location.hash;
    const sep = url.includes("?") ? "&" : "?";
    window.location.href = `${url}${sep}returnTo=${encodeURIComponent(returnTo)}`;
  });

  // SMS (Twilio Verify)
  const form = document.querySelector("[data-auth-sms-form]");
  if (!form) return;

  // Build UI for code step (hidden until needed)
  const codeWrap = document.createElement("div");
  codeWrap.className = "sms-code";
  codeWrap.hidden = true;
  codeWrap.innerHTML = `
    <label class="label" for="smsCode">Enter code</label>
    <div class="sms-row">
      <input id="smsCode" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" placeholder="123456" />
      <button class="btn btn-primary" type="button" data-verify-code>Verify</button>
    </div>
    <p class="micro subtle">No passwords. Just the one-time code.</p>
  `;
  form.appendChild(codeWrap);

  let lastPhone = "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const phone = (new FormData(form).get("phone") || "").toString().trim();
    if (!phone) {
      toast("Enter a phone number.");
      return;
    }

    lastPhone = phone;

    if (!cfg.smsStartUrl) {
      toast("SMS endpoints not configured yet.");
      return;
    }

    try {
      const res = await fetch(cfg.smsStartUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });

      if (!res.ok) throw new Error("Bad response");
      const data = await res.json();
      if (!data || data.success !== true) throw new Error("Start failed");

      codeWrap.hidden = false;
      const codeInput = $("#smsCode", codeWrap);
      if (codeInput) codeInput.focus();
      toast("Code sent.");
    } catch (err) {
      toast("Could not send code (check your backend endpoint).");
    }
  });

  form.addEventListener("click", async (e) => {
    const verifyBtn = e.target.closest("[data-verify-code]");
    if (!verifyBtn) return;

    const codeInput = $("#smsCode", form);
    const code = (codeInput ? codeInput.value : "").trim();
    if (!code) {
      toast("Enter the code.");
      return;
    }

    if (!cfg.smsVerifyUrl) {
      toast("SMS verify endpoint not configured yet.");
      return;
    }

    try {
      const res = await fetch(cfg.smsVerifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: lastPhone, code })
      });

      if (!res.ok) throw new Error("Bad response");
      const data = await res.json();
      if (!data || data.success !== true) throw new Error("Verify failed");

      toast("Signed in.");
      // If your backend sets a cookie, you can redirect now:
      window.location.href = (window.OUT_CONFIG && window.OUT_CONFIG.links && window.OUT_CONFIG.links.home) || "/";
    } catch (err) {
      toast("Could not verify code.");
    }
  });
})();
