import useSound from 'use-sound';
import { useCallback } from 'react';

export const useKRYTAAudio = () => {
  // Load SFX (Paths are relative to the public folder)
  const [playClick] = useSound('/sounds/click.mp3', { volume: 0.5 });
  const [playSuccess] = useSound('/sounds/success.mp3', { volume: 0.4 });
  const [playError] = useSound('/sounds/error.mp3', { volume: 0.3 });

  // Text-to-Speech (The DAEMON Voice)
  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;

    // Cancel current speech to avoid overlap
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Config: Try to find a "System" or "Robot" like voice
    const voices = window.speechSynthesis.getVoices();
    // Prefer Microsoft Zira (Windows) or Samantha (Mac) or Google US English
    const preferredVoice = voices.find(v =>
      v.name.includes("Zira") || v.name.includes("Samantha") || v.name.includes("Google US English")
    );

    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.pitch = 0.9; // Slightly lower pitch for authority
    utterance.rate = 1.1;  // Slightly faster execution
    utterance.volume = 0.8;

    window.speechSynthesis.speak(utterance);
  }, []);

  return {
    playClick,
    playSuccess,
    playError,
    speak
  };
};