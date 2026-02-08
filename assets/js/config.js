/* OUT-2026-home config
   Edit these URLs/endpoints to match your environment.
*/
window.OUT_CONFIG = {
  links: {
    home: "index.html",
    sellListing: "https://adamqureshi.com/out-sell-my-tesla-2026/",
    outCheck: "https://adamqureshi.com/out-check-landing/",
    cashOffer: "https://onlyusedtesla.com/get-cash-offer/",
    shop: "https://onlyusedtesla.com/used-tesla-for-sale/",
    dealers: "https://onlyusedtesla.com/dealers/",
    contact: "https://onlyusedtesla.com/contact-us/",
    redditThread: "https://www.reddit.com/r/teslaclassifieds/comments/g41wq3/onlyusedtesla_website_questions_is_it_safe_and/"
  },

  auth: {
    /* Backend route that begins Google OAuth (recommended) */
    googleStartUrl: "/auth/google",

    /* Optional Twilio Verify endpoints (you can build these later):
       - POST smsStartUrl { phone: "+1..." } -> { success: true }
       - POST smsVerifyUrl { phone: "+1...", code: "123456" } -> { success: true, token: "..." }
    */
    smsStartUrl: "/auth/sms/start",
    smsVerifyUrl: "/auth/sms/verify"
  },

  chat: {
    /* Optional AI endpoint.
       If present, the widget will try to call it.
       - POST /api/chat { message, context } -> { reply, quickReplies?: string[] }
    */
    apiUrl: "/api/chat"
  }
};
