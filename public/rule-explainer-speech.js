import { SUPPORTED_LANGUAGES, explainRule, explanationToText } from "./rule-explainer-core.js";

function speechEngine() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    throw new Error("Speech synthesis is not available in this environment.");
  }
  return window.speechSynthesis;
}

export function speakRule(ruleId, language = "en", { rate = 0.98, pitch = 1, volume = 1 } = {}) {
  const engine = speechEngine();
  const explanation = explainRule(ruleId, language);
  const languageConfig = SUPPORTED_LANGUAGES.find((item) => item.code === explanation.language);
  engine.cancel();
  const utterance = new SpeechSynthesisUtterance(explanationToText(explanation));
  utterance.lang = languageConfig?.speechLocale || "en-US";
  utterance.rate = Number(rate) || 0.98;
  utterance.pitch = Number(pitch) || 1;
  utterance.volume = Number(volume) || 1;
  engine.speak(utterance);
  return utterance;
}

export function pauseSpeech() {
  const engine = speechEngine();
  if (engine.speaking && !engine.paused) engine.pause();
}

export function resumeSpeech() {
  const engine = speechEngine();
  if (engine.paused) engine.resume();
}

export function cancelSpeech() {
  speechEngine().cancel();
}

