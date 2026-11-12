import { useState, type FormEvent } from "react";
import { FIGURE_LABELS, FRAGMENTS, LANGUAGES, SHARE_TEXT, TALK_URL } from "../content/chapters";
import type { Alarm } from "../state/alarm";
import type { Beams } from "../state/beams";

/** Chapter 3: shows the fragment the visitor touched. */
export function FragmentReader({ index }: { index: number }) {
  const f = index >= 0 ? FRAGMENTS[index] : null;
  return (
    <div className="reader" aria-live="polite">
      {f ? (
        <>
          <span className="reader-kind">{f.kind}</span>
          <q className="reader-text" lang={f.lang} dir={f.rtl ? "rtl" : undefined}>
            {f.text}
          </q>
          {f.gloss && <span className="reader-gloss">{f.gloss}</span>}
        </>
      ) : (
        <span className="reader-hint">The glowing marks around the network are fragments. Pick one.</span>
      )}
    </div>
  );
}

/** Chapter 4: three buttons, one per language. */
export function LanguagePicker({ beams }: { beams: Beams }) {
  const all = beams.answered.every(Boolean);
  const busy = beams.stage === "in" || beams.stage === "core";
  let status = "Pick a language.";
  if (busy) status = "The question goes in…";
  else if (all) status = "Three languages. One pattern in the middle.";
  else if (beams.stage === "done") status = `It answers "${LANGUAGES[beams.picked].answer}". Now try another language.`;
  return (
    <div className="langs" data-noswipe>
      <div className="lang-row">
        {LANGUAGES.map((l, k) => (
          <button
            key={l.name}
            className={`chip lang-button${beams.answered[k] ? " seen" : ""}`}
            aria-pressed={beams.picked === k}
            lang={l.lang}
            disabled={busy}
            onClick={() => beams.pick(k)}
          >
            {l.name}
          </button>
        ))}
      </div>
      <span className="game-status" aria-live="polite">
        {status}
      </span>
    </div>
  );
}

/** Chapter 5: lets the visitor watch the emergency scene again. */
export function AlarmReplay({ alarm }: { alarm: Alarm }) {
  return (
    <div className="replay" data-noswipe>
      <button className="chip" onClick={alarm.play} disabled={alarm.stage < 3}>
        Play it again
      </button>
    </div>
  );
}

/** Chapter 6: the switch that decides whether the second model is told the shortcut is allowed. */
export function ShortcutToggle({ allowed, onChange }: { allowed: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="toggle" data-noswipe>
      <button className="switch" role="switch" aria-checked={allowed} onClick={() => onChange(!allowed)}>
        <span className="switch-track" aria-hidden="true">
          <span className="switch-knob" />
        </span>
        <span className="switch-text">
          {FIGURE_LABELS.toggle}: <strong>{allowed ? "ON" : "OFF"}</strong>
        </span>
      </button>
      <span className="game-status" aria-live="polite">
        {allowed ? FIGURE_LABELS.on : FIGURE_LABELS.off}
      </span>
    </div>
  );
}

/** Chapter 8: the visitor's own sentence, and the buttons that end the site. */
export function StoryForm({ story, onStory }: { story: string; onStory: (s: string) => void }) {
  const [draft, setDraft] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onStory(text);
    setDraft("");
  };
  const [copied, setCopied] = useState(false);
  // Phones open their own share menu (messages, mail, any app). Elsewhere the link is copied.
  const share = async () => {
    const url = location.origin + location.pathname;
    if (navigator.share) {
      try {
        await navigator.share({ title: "What AI Actually Is", text: SHARE_TEXT, url });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT} ${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2600);
    } catch {
      window.prompt("Copy this link to share it:", url);
    }
  };
  return (
    <div className="story" data-noswipe>
      <form className="story-form" onSubmit={submit}>
        <input
          className="story-input"
          type="text"
          value={draft}
          maxLength={120}
          placeholder={story ? "Write another one" : "Your sentence"}
          aria-label="Your sentence"
          enterKeyHint="send"
          autoComplete="off"
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="chip story-add" type="submit" disabled={!draft.trim()}>
          Add it
        </button>
      </form>
      {story && (
        <p className="story-kept" aria-live="polite">
          In the cloud now: <q>{story}</q>
        </p>
      )}
      <div className="end-buttons">
        <button className="primary end-share" onClick={share}>
          {copied ? "Link copied" : "Share"}
        </button>
        <a className="chip end-link" href={TALK_URL} target="_blank" rel="noopener noreferrer">
          Watch the original talk
        </a>
      </div>
    </div>
  );
}
