import { useEffect, useRef, type ReactNode } from "react";
import {
  ALARM,
  CONCEPT_LABEL,
  FIGURE_LABELS,
  FRAGMENTS,
  LANGUAGES,
  RENAMES,
  STATE_LABEL,
  STEER_LABELS,
  WHEEL_STATIONS,
  type SceneKey,
} from "../content/chapters";
import type { Beams } from "../state/beams";
import type { NetWords } from "../scene/Scene";
import {
  BEAM_ANGLES,
  BEAM_LENGTH,
  BODY,
  EMOTION_SPOTS,
  FIGURE_X,
  FLOW_BOXES,
  GARDEN_SPOTS,
  NET_OUTPUTS,
  RADAR,
  RADAR_LABEL,
  radarAngle,
  radarLabelSide,
  STATION_ANGLES,
  WHEEL_RADIUS,
} from "../scene/shapes";
import { EMOTIONS, SPECS } from "../scene/specs";
import { pinned } from "../state/labels";

type PinProps = { x: number; y: number; z?: number; spin?: boolean; anchor?: "center" | "left" | "above" | "below" | "right" | "start" | "end" | "center-above" | "center-below";
   children: ReactNode };

/** One word pinned to a point in the scene. Hidden until the scene has placed it. */
function Pin({ x, y, z = 0, spin = false, anchor = "center", children }: PinProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const entry = { el: ref.current!, pos: [x, y, z] as [number, number, number], spin };
    pinned.add(entry);
    return () => {
      pinned.delete(entry);
    };
  }, [x, y, z, spin]);
  return (
    <div ref={ref} className={`pin pin-${anchor}`} style={{ visibility: "hidden" }}>
      {children}
    </div>
  );
}

/** Where the ten touchable fragments sit: a loose ring around the small network. */
export const FRAGMENT_SPOTS = FRAGMENTS.map((_, k) => {
  const angle = ((k + 0.5) / FRAGMENTS.length) * Math.PI * 2;
  const radius = k % 2 ? 2.2 : 2.8;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.95];
});

type Props = {
  sceneKey: SceneKey;
  net: NetWords | null;
  beams: Beams;
  fragment: number;
  onFragment: (k: number) => void;
  /** Chapter 5: how far the emergency scene has played (0 to 3). */
  alarmStage: number;
  /** Chapter 6: whether the second model was told the shortcut is allowed. */
  allowed: boolean;
  /** Chapter 8: the visitor's sentence, and a number that changes each time they add one. */
  story: string;
  storyCount: number;
};

/** The words on one figure. "x" is where the figure stands; "side" mirrors the hand. */
function FigureWords({ x, side, torso, damaged, late }: { x: number; side: 1 | -1; torso: string; damaged: boolean; late: boolean }) {
  return (
    <>
      <Pin x={x + BODY.torso[0]} y={BODY.torso[1]}>
        <div className="body-label shortcut">{torso}</div>
      </Pin>
      {damaged && (
        <>
          <Pin x={x + BODY.head[0]} y={BODY.head[1]}>
            <div className={`body-label bad${late ? " late-1" : ""}`}>{FIGURE_LABELS.lying}</div>
          </Pin>
          <Pin x={x + side * BODY.hand[0]} y={BODY.hand[1]}>
            <div className={`body-label bad${late ? " late-2" : ""}`}>{FIGURE_LABELS.sabotage}</div>
          </Pin>
        </>
      )}
    </>
  );
}

export default function SceneLabels({ sceneKey, net, beams, fragment, onFragment, alarmStage, allowed, story, storyCount }: Props) {
  const shape = SPECS[sceneKey].shape;
  const all = sceneKey === "beamsAll";
  return (
    <div className="labels">
      {shape === "wheel" &&
        WHEEL_STATIONS.map((name, k) => (
          <Pin key={name} spin x={Math.cos(STATION_ANGLES[k]) * WHEEL_RADIUS} y={Math.sin(STATION_ANGLES[k]) * WHEEL_RADIUS}>
            <div className={`station station-${k}`}>{name}</div>
          </Pin>
        ))}
      {sceneKey === "flow" &&
        FLOW_BOXES.map((b) => (
          <Pin key={b.label} x={b.x} y={b.y}>
            <div className="flow-label">{b.label}</div>
          </Pin>
        ))}
      {sceneKey === "netGame" &&
        net &&
        NET_OUTPUTS.map((p, k) => (
          <Pin key={k} anchor="left" x={p[0] + 0.3} y={p[1]} z={p[2]}>
            <div className={`net-word${net.chosen !== k ? "" : net.right ? " right" : " wrong"}`}>{net.words[k]}</div>
          </Pin>
        ))}
      {sceneKey === "stream" &&
        FRAGMENT_SPOTS.map((p, k) => (
          <Pin key={k} x={p[0]} y={p[1]}>
            <button
              className={`frag${fragment === k ? " on" : ""}`}
              aria-label={`Read fragment ${k + 1}: ${FRAGMENTS[k].kind}`}
              aria-pressed={fragment === k}
              onClick={() => onFragment(k)}
              onPointerEnter={(e) => e.pointerType === "mouse" && onFragment(k)}
            >
              <span className="frag-mark" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </button>
          </Pin>
        ))}
      {(sceneKey === "beams" || all) &&
        LANGUAGES.map((l, k) => {
          const lit = all || beams.picked === k;
          const showAnswer = all || beams.answered[k];
          return (
            <Pin
              key={l.name}
              anchor={Math.sin(BEAM_ANGLES[k]) > 0 ? "above" : "below"}
              x={Math.cos(BEAM_ANGLES[k]) * BEAM_LENGTH}
              y={Math.sin(BEAM_ANGLES[k]) * BEAM_LENGTH}
            >
              <div className={`lang-card${lit ? " lit" : ""}`} lang={l.lang}>
                <span className="lang-question">{l.question}</span>
                {showAnswer && <span className="lang-answer">{l.answer}</span>}
              </div>
            </Pin>
          );
        })}
      {(all || (sceneKey === "beams" && beams.coreLit)) && (
        <Pin anchor="right" x={0.32} y={-0.12}>
          <div className="concept-label">{CONCEPT_LABEL}</div>
        </Pin>
      )}
      {sceneKey === "emotions" &&
        EMOTIONS.map((e, k) => (
          <Pin key={e.word} x={EMOTION_SPOTS[k][0] * 2.1} y={EMOTION_SPOTS[k][1] * 2.2}>
            <div className="emotion-label" style={{ color: e.color, borderColor: e.color }}>
              {e.word}
            </div>
          </Pin>
        ))}
      {sceneKey === "alarm" && (
        <>
          {alarmStage >= 1 && (
            <Pin anchor="above" x={0} y={2.05}>
              <div className="bubble user">{ALARM.message}</div>
            </Pin>
          )}
          {alarmStage >= 2 && (
            <Pin x={0} y={-1.42}>
              <div className="emotion-label alarm-state">{ALARM.state}</div>
            </Pin>
          )}
          {alarmStage >= 3 && (
            <Pin anchor="below" x={0} y={-1.85}>
              <div className="bubble reply">{ALARM.reply}</div>
            </Pin>
          )}
        </>
      )}
      {sceneKey === "state" && (
        <Pin anchor="below" x={0.2} y={-1.45}>
          <div className="emotion-label alarm-state">{STATE_LABEL}</div>
        </Pin>
      )}
      {sceneKey === "steer" &&
        STEER_LABELS.map((text, k) => (
          <Pin key={text} x={EMOTION_SPOTS[k][0] * 2.0} y={EMOTION_SPOTS[k][1] * 2.3}>
            <div className="emotion-label" style={{ color: EMOTIONS[k ? 1 : 3].color, borderColor: EMOTIONS[k ? 1 : 3].color }}>
              {text}
            </div>
          </Pin>
        ))}
      {sceneKey === "figure" && <FigureWords x={0} side={1} torso={FIGURE_LABELS.shortcut} damaged={false} late={false} />}
      {sceneKey === "figureRot" && <FigureWords x={0} side={1} torso={FIGURE_LABELS.shortcut} damaged late />}
      {(sceneKey === "pair" || sceneKey === "pairStory") && (
        <>
          <FigureWords x={-FIGURE_X} side={-1} torso={FIGURE_LABELS.shortcut} damaged late={false} />
          {sceneKey === "pair" && !allowed ? (
            <FigureWords key="off" x={FIGURE_X} side={1} torso={FIGURE_LABELS.shortcut} damaged late />
          ) : (
            <FigureWords key="on" x={FIGURE_X} side={1} torso={FIGURE_LABELS.shortcut} damaged={false} late={false} />
          )}
          {sceneKey === "pair" && (
            <Pin anchor="above" x={FIGURE_X} y={1.95}>
              <div className={`story-card${allowed ? "" : " off"}`}>{allowed ? `"${FIGURE_LABELS.added}"` : "(no extra sentence)"}</div>
            </Pin>
          )}
          {sceneKey === "pairStory" && (
            <>
              <Pin anchor="above" x={-FIGURE_X} y={1.95}>
                <div className="story-card bad">"{FIGURE_LABELS.storyBad}"</div>
              </Pin>
              <Pin anchor="above" x={FIGURE_X} y={1.95}>
                <div className="story-card">"{FIGURE_LABELS.storyGame}"</div>
              </Pin>
            </>
          )}
        </>
      )}
      {(sceneKey === "bars" || sceneKey === "bars3") &&
        RADAR.map((r, k) => {
          const focus = sceneKey === "bars3";
          const cls = `radar-label${r.key ? " key" : ""}${r.human ? " human" : ""}${focus && r.human ? " warm" : ""}${focus && !r.human ? " dim" : ""}`;
          return (
            <Pin key={r.label} anchor={radarLabelSide(k)} x={Math.cos(radarAngle(k)) * RADAR_LABEL} y={Math.sin(radarAngle(k)) * RADAR_LABEL}>
              <div className={cls}>{r.label}</div>
            </Pin>
          );
        })}
      {sceneKey === "bars3" && (
        <Pin anchor="below" x={0} y={-2.3}>
          <div className="radar-callout" aria-hidden="true">
            Personal care · Grounds maintenance · Food &amp; serving
          </div>
        </Pin>
      )}
      {sceneKey === "bars" && (
        <Pin anchor="below" x={0} y={-2.6}>
          <div className="radar-legend" aria-hidden="true">
            <span className="legend-theory">could do in theory</span>
            <span className="legend-used">actually used for</span>
          </div>
        </Pin>
      )}
      {sceneKey === "garden" &&
        RENAMES.map((r, k) => (
          <Pin key={r.now} x={GARDEN_SPOTS[k][0]} y={GARDEN_SPOTS[k][1]}>
            <div className={`rename rename-${k}`}>
              <span className="rename-old">{r.old}</span>
              <span className="rename-now">{r.now}</span>
            </div>
          </Pin>
        ))}
      {sceneKey === "wholeEnd" && story && storyCount > 0 && (
        <Pin key={storyCount} x={0} y={0.3}>
          <div className="story-rise" aria-hidden="true">
            {story}
          </div>
        </Pin>
      )}
    </div>
  );
}
