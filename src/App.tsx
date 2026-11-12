import { lazy, Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CHAPTERS, CREDIT, TALK_URL } from "./content/chapters";
import { detectTier, hasWebGL, prefersReducedMotion } from "./scene/device";
import { TURNS_TO_FULL } from "./scene/specs";
import { getWholeTurns, live, subscribeTurns } from "./state/live";
import { useAdvanceInputs, useNav } from "./state/nav";
import { useAlarm } from "./state/alarm";
import { useBeams } from "./state/beams";
import { useGuessGame } from "./state/game";
import { AlarmReplay, FragmentReader, LanguagePicker, ShortcutToggle, StoryForm } from "./ui/ChapterPanels";
import Fallback2D from "./ui/Fallback2D";
import GuessPanel from "./ui/GuessPanel";
import ScalingChart from "./ui/ScalingChart";
import SceneLabels from "./ui/SceneLabels";

// Start fetching the 3D code right away, in parallel with the first paint of the text.
const sceneCode = import("./scene/Scene");
const Scene = lazy(() => sceneCode);

export default function App() {
  const nav = useNav();
  const env = useMemo(() => ({ webgl: hasWebGL(), reduced: prefersReducedMotion(), tier: detectTier() }), []);
  const [compute, setCompute] = useState(0.12);
  const computeRef = useRef(compute);
  computeRef.current = compute;
  const [menuOpen, setMenuOpen] = useState(false);
  const sourcesRef = useRef<HTMLDialogElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const chapter = CHAPTERS[nav.chapter];
  const step = chapter.steps[nav.step];
  const isFirst = nav.index === 0;
  const isLast = nav.index === nav.total - 1;
  const totalChapters = CHAPTERS.length - 1;

  const game = useGuessGame(step.interactive === "guess");
  const net = useMemo(
    () => (step.scene === "netGame" ? { words: game.words, chosen: game.chosen, right: game.right } : null),
    [step.scene, game.words, game.chosen, game.right],
  );

  const beams = useBeams(step.interactive === "languages");
  const [fragment, setFragment] = useState(-1);
  const alarm = useAlarm(step.interactive === "alarm");
  const [allowed, setAllowed] = useState(true);
  // The visitor's own sentence is kept in this browser only.
  const [story, setStory] = useState(() => {
    try {
      return localStorage.getItem("wai-story") ?? "";
    } catch {
      return "";
    }
  });
  const [storyCount, setStoryCount] = useState(0);
  const addStory = (text: string) => {
    setStory(text);
    setStoryCount((n) => n + 1);
    live.flash = 1;
    try {
      localStorage.setItem("wai-story", text);
    } catch {
      // Private browsing may refuse storage. The sentence still shows for this visit.
    }
  };
  const changeAllowed = (v: boolean) => {
    setAllowed(v);
    live.allowed = v;
    if (!v) live.restartRot = true;
  };

  useAdvanceInputs(nav.next, nav.prev, panelOpen || menuOpen);

  useEffect(() => {
    document.title = chapter.id === 0 ? "What AI Actually Is" : `${chapter.title} · What AI Actually Is`;
  }, [chapter]);

  const openSources = () => {
    sourcesRef.current?.showModal();
    setPanelOpen(true);
  };

  return (
    <div className={`app${env.reduced ? " reduced" : ""}`}>
      <div className="stage">
        {env.webgl ? (
          <Suspense fallback={null}>
            <Scene sceneKey={step.scene} computeRef={computeRef} reduced={env.reduced} tier={env.tier} />
          </Suspense>
        ) : (
          <Fallback2D sceneKey={step.scene} compute={compute} net={net} beams={beams} fragment={fragment} onFragment={setFragment} alarmStage={alarm.stage} allowed={allowed} />
        )}
      </div>
      {env.reduced && <div className="veil" key={step.scene} />}
      <div className="vignette" />
      {env.webgl && <SceneLabels sceneKey={step.scene} net={net} beams={beams} fragment={fragment} onFragment={setFragment} alarmStage={alarm.stage} allowed={allowed} story={story} storyCount={storyCount} />}

      <header className="topbar">
        <button className="brand" onClick={() => nav.goChapter(0)} aria-label="What AI Actually Is, back to the start">
          What AI Actually Is
        </button>
        <div className="topbar-actions">
          <button className="chip" onClick={openSources}>
            Sources
          </button>
          <button
            className="chip menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="chapters"
            aria-label={chapter.id === 0 ? "Chapters" : `Chapters. You are in chapter ${chapter.id} of ${totalChapters}`}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {chapter.id === 0 ? "Chapters" : `${chapter.id} / ${totalChapters}`}
          </button>
        </div>
      </header>

      <nav id="chapters" className={`chapters${menuOpen ? " open" : ""}`} aria-label="Chapters" data-noswipe>
        <ol>
          {CHAPTERS.map((c, i) => (
            <li key={c.id}>
              <button
                className="chapter-link"
                aria-current={i === nav.chapter ? "step" : undefined}
                onClick={() => {
                  nav.goChapter(c.id);
                  setMenuOpen(false);
                }}
              >
                <span className="dot" />
                <span className="chapter-name">
                  {c.id === 0 ? "Intro" : `${c.id}. ${c.title}`}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      {menuOpen && <button className="scrim" aria-label="Close chapter list" onClick={() => setMenuOpen(false)} />}

      <main className="panel">
        <div className="copy" key={nav.index} aria-live="polite">
          {chapter.id > 0 && (
            <p className="kicker">
              Chapter {chapter.id} · {chapter.title}
            </p>
          )}
          <h1 className={isFirst || step.big ? "hero" : ""}>{step.headline}</h1>
          <p className="body">{step.text}</p>

          {step.interactive === "compute" && (
            <label className="slider" data-noswipe>
              <span className="slider-label">
                <span>compute</span>
                <span className="slider-hint">drag me</span>
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={compute}
                onChange={(e) => setCompute(Number(e.target.value))}
                aria-label="Compute"
                aria-valuetext={`${Math.round(compute * 100)} percent`}
              />
            </label>
          )}
          {step.interactive === "compute" && <ScalingChart value={compute} />}
          {step.interactive === "wheel" && <SpinControl />}
          {step.interactive === "guess" && <GuessPanel game={game} />}
          {step.interactive === "fragments" && <FragmentReader index={fragment} />}
          {step.interactive === "languages" && <LanguagePicker beams={beams} />}
          {step.interactive === "toggle" && <ShortcutToggle allowed={allowed} onChange={changeAllowed} />}
          {step.small && <p className="fineprint">{step.small}</p>}
          {step.interactive === "alarm" && <AlarmReplay alarm={alarm} />}
          {step.interactive === "story" && <StoryForm story={story} onStory={addStory} />}
        </div>

        <div className="controls">
          {isFirst ? (
            <button className="begin" onClick={nav.next}>
              <span>Begin</span>
              <span className="begin-arrow" aria-hidden="true">
                →
              </span>
            </button>
          ) : (
            <>
              <button className="ghost" onClick={nav.prev} aria-label="Back">
                <span aria-hidden="true">←</span>
              </button>
              {isLast ? (
                <button className="chip" onClick={() => nav.goChapter(0)}>
                  Start again
                </button>
              ) : (
                <button className="primary" onClick={nav.next}>
                  Next
                </button>
              )}
              <span className="ticks" aria-label={`Step ${nav.step + 1} of ${chapter.steps.length}`}>
                {chapter.steps.map((_, i) => (
                  <span key={i} className={i === nav.step ? "tick on" : "tick"} />
                ))}
              </span>
            </>
          )}
        </div>
        {isFirst && (
          <p className="credit-line">
            Inspired by Chloe Lubinski's talk "How AI works (in 14 minutes)".{" "}
            <a href={TALK_URL} target="_blank" rel="noopener noreferrer">
              Watch the original talk
            </a>
          </p>
        )}
      </main>

      <dialog
        ref={sourcesRef}
        className="sources"
        data-noswipe
        onClose={() => setPanelOpen(false)}
        onClick={(e) => e.target === e.currentTarget && sourcesRef.current?.close()}
      >
        <div className="sources-inner">
          <h2>Sources</h2>
          <p className="sources-chapter">{chapter.id === 0 ? "Intro" : `Chapter ${chapter.id} · ${chapter.title}`}</p>
          {chapter.sources.length === 0 ? (
            <p>This part makes no research claims. Each chapter lists its sources here.</p>
          ) : (
            <ul>
              {chapter.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {chapter.notes.map((n) => (
            <p key={n} className="note">
              {n}
            </p>
          ))}
          <h2>Credits</h2>
          <p>
            {CREDIT.talk}.{" "}
            <a href={TALK_URL} target="_blank" rel="noopener noreferrer">
              Watch the talk
            </a>
          </p>
          <p>
            Made by Rasheed (
            <a href={CREDIT.x} target="_blank" rel="noopener noreferrer">
              @earlythesis
            </a>
            ). Not affiliated with Anthropic.
          </p>
          <p>No cookies, no tracking.</p>
          <button className="primary" onClick={() => sourcesRef.current?.close()}>
            Close
          </button>
        </div>
      </dialog>
    </div>
  );
}

/** A button that pushes the wheel, for keyboards and for anyone who does not find the drag. */
function SpinControl() {
  const turns = useSyncExternalStore(subscribeTurns, getWholeTurns);
  const done = turns >= TURNS_TO_FULL;
  return (
    <div className="spin" data-noswipe>
      <button className="chip spin-button" onClick={() => (live.impulse += 5)}>
        Spin the wheel
      </button>
      <span className="spin-count" aria-live="polite">
        {turns === 0
          ? "or drag it with your finger"
          : done
            ? `${turns} turns. The model keeps growing.`
            : `${turns} ${turns === 1 ? "turn" : "turns"}. Keep going.`}
      </span>
    </div>
  );
}
