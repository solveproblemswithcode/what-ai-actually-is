import { useCallback, useEffect, useRef, useState } from "react";
import { GUESS_SENTENCES } from "../content/chapters";
import { live, SWEEP_MS } from "./live";

export type GamePhase = "idle" | "thinking" | "shown" | "correcting";

const START_STRENGTH = 0.12;

/**
 * The "guess the next word" game. The network guesses, the visitor corrects it,
 * and the path to the right word gets a little stronger each time.
 */
export function useGuessGame(active: boolean) {
  const [sentence, setSentence] = useState(0);
  const [tries, setTries] = useState(-1);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const strength = useRef([START_STRENGTH, START_STRENGTH, START_STRENGTH]);
  const timer = useRef(0);

  const current = GUESS_SENTENCES[sentence];
  const rightWord = current.guesses[current.guesses.length - 1];
  const chosen = phase === "shown" ? current.guesses[tries] : -1;
  const right = chosen === rightWord;
  const isLast = sentence === GUESS_SENTENCES.length - 1;

  const think = useCallback((s: number, t: number) => {
    const sen = GUESS_SENTENCES[s];
    const target = sen.guesses[sen.guesses.length - 1];
    setPhase("thinking");
    live.net.sweepDir = 1;
    live.net.sweepAt = performance.now();
    live.net.wrong = [0, 0, 0];
    live.net.glow = [...strength.current];
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const pick = sen.guesses[t];
      setTries(t);
      setPhase("shown");
      live.net.glow = strength.current.map((v, i) => (i === pick ? 1 : v * 0.5));
      live.net.wrong = [0, 1, 2].map((i) => (i === pick && pick !== target ? 1 : 0));
    }, SWEEP_MS);
  }, []);

  const guess = useCallback(() => think(sentence, 0), [think, sentence]);

  const correct = useCallback(() => {
    if (chosen < 0) return;
    strength.current[chosen] = 0.02;
    strength.current[rightWord] += 0.3;
    setPhase("correcting");
    live.net.sweepDir = -1;
    live.net.sweepAt = performance.now();
    live.net.nudge = 1;
    live.net.wrong = [0, 0, 0];
    live.net.glow = [...strength.current];
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => think(sentence, tries + 1), SWEEP_MS + 300);
  }, [chosen, rightWord, sentence, tries, think]);

  const nextSentence = useCallback(() => {
    const s = isLast ? 0 : sentence + 1;
    strength.current = [START_STRENGTH, START_STRENGTH, START_STRENGTH];
    setSentence(s);
    setTries(-1);
    think(s, 0);
  }, [isLast, sentence, think]);

  // Leaving the step in the middle of an animation: stop cleanly so nothing fires later.
  useEffect(() => {
    if (active) return;
    window.clearTimeout(timer.current);
    setPhase((p) => (p === "thinking" || p === "correcting" ? "idle" : p));
  }, [active]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return {
    text: current.text,
    words: current.words,
    rightWord: current.words[rightWord],
    chosen,
    right,
    phase,
    sentence,
    total: GUESS_SENTENCES.length,
    isLast,
    firstTry: tries === 0,
    guess,
    correct,
    nextSentence,
  };
}

export type GuessGame = ReturnType<typeof useGuessGame>;
