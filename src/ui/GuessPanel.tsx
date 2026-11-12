import type { GuessGame } from "../state/game";

/** The sentence with a blank, and the one button that drives the guessing game. */
export default function GuessPanel({ game }: { game: GuessGame }) {
  const busy = game.phase === "thinking" || game.phase === "correcting";
  const shown = game.phase === "shown";
  let label = "Let it guess";
  let action = game.guess;
  let status = "The network has not learned anything yet.";
  if (game.phase === "thinking") {
    label = "Guessing…";
    status = "A signal runs through the network.";
  }
  if (game.phase === "correcting") {
    label = "Correcting…";
    status = "The correction runs back and nudges the connections.";
  }
  if (shown && !game.right) {
    label = "Correct it";
    action = game.correct;
    status = `Wrong. The text said "${game.rightWord}".`;
  }
  if (shown && game.right) {
    label = game.isLast ? "Play again" : "Next sentence";
    action = game.nextSentence;
    status = game.firstTry ? "Right on the first try. It is starting to learn." : "Right. Those connections just got stronger.";
  }
  const blankClass = !shown ? "blank" : game.right ? "blank right" : "blank wrong";
  return (
    <div className="game" data-noswipe>
      <p className="sentence">
        <span className="game-count">
          Sentence {game.sentence + 1} of {game.total}
        </span>
        {game.text} <span className={blankClass}>{shown ? game.words[game.chosen] : " "}</span>
      </p>
      <div className="game-row">
        <button className="chip game-button" onClick={action} disabled={busy}>
          {label}
        </button>
        <span className="game-status" aria-live="polite">
          {status}
        </span>
      </div>
    </div>
  );
}
