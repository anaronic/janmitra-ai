const LANGUAGE_TO_BCP47 = {
  Hindi: "hi-IN",
  English: "en-IN",
  Bengali: "bn-IN",
  Telugu: "te-IN",
  Tamil: "ta-IN",
  Marathi: "mr-IN",
  Kannada: "kn-IN",
  Malayalam: "ml-IN",
  Gujarati: "gu-IN",
  Punjabi: "pa-IN",
};

export function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text, language = "Hindi") {
  if (!isSpeechSupported() || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const locale = LANGUAGE_TO_BCP47[language] || "hi-IN";
  utterance.lang = locale;

  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang === locale) || voices.find((v) => v.lang.startsWith(locale.split("-")[0]));
  if (match) utterance.voice = match;

  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}
