function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  get supabaseUrl() {
    return required("SUPABASE_URL");
  },
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get twilioAuthToken() {
    return required("TWILIO_AUTH_TOKEN");
  },
  get twilioAccountSid() {
    return required("TWILIO_ACCOUNT_SID");
  },
  get twilioWebhookBaseUrl() {
    return required("TWILIO_WEBHOOK_BASE_URL").replace(/\/$/, "");
  },
  get openAiApiKey() {
    return required("OPENAI_API_KEY");
  },
  get groqApiKey() {
    return required("GROQ_API_KEY");
  },
};
