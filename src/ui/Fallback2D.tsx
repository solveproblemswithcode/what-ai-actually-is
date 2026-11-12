import { useMemo } from "react";
import {
  ALARM,
  CONCEPT_LABEL,
  FIGURE_LABELS,
  FRAGMENTS,
  LANGUAGES,
  RENAMES,
  WHEEL_STATIONS,
  type SceneKey,
} from "../content/chapters";
import type { Beams } from "../state/beams";
import { FRAGMENT_SPOTS } from "./SceneLabels";
import { hotRegions, SPECS } from "../scene/specs";
import type { NetWords } from "../scene/Scene";
import {
  BEAM_ANGLES,
  BEAM_LENGTH,
  FIGURE_X,
  FLOW_BOXES,
  GARDEN_SPOTS,
  GROUND_Y,
  RADAR,
  RADAR_LABEL,
  RADAR_SCALE,
  RADAR_SPOKE,
  radarAngle,
  NET_CENTER_X,
  NET_COLUMNS,
  STATION_ANGLES,
  WHEEL_RADIUS,
} from "../scene/shapes";

/** A flat picture of the same scene, for browsers that cannot draw 3D. */
type Props = {
  sceneKey: SceneKey;
  compute: number;
  net: NetWords | null;
  beams: Beams;
  fragment: number;
  onFragment: (k: number) => void;
  alarmStage: number;
  allowed: boolean;
};

/** A plain standing figure. Turns ember red when damaged. */
function FigureDrawing({ x, damaged, caption, warm }: { x: number; damaged: boolean; caption?: string; warm?: boolean }) {
  const c = damaged ? "#c2452c" : warm ? "#ffb469" : "#8fb8ff";
  return (
    <g transform={`translate(${x} 0)`} stroke={c} strokeWidth={0.16} strokeLinecap="round" fill="none" opacity={damaged ? 0.75 : 1}>
      <circle cy={-1.55} r={0.28} fill={c} stroke="none" />
      <path d="M-0.45 -1.05 H0.45 L0.34 0.2 H-0.34 Z" fill={c} fillOpacity={0.35} strokeWidth={0.05} />
      <path d="M-0.58 -1.05 L-0.76 0.14 M0.58 -1.05 L0.76 0.14 M-0.2 0.3 L-0.3 1.75 M0.2 0.3 L0.3 1.75" />
      {!warm && <circle cy={-0.35} r={0.16} fill="#ffb469" stroke="none" />}
      {damaged && (
        <text y={2.2} textAnchor="middle" fontSize={0.26} fill="#ffa48c" stroke="none">
          {FIGURE_LABELS.lying}, {FIGURE_LABELS.sabotage}
        </text>
      )}
      {caption && (
        <text y={-2.1} textAnchor="middle" fontSize={0.24} fill="#f3ede2" stroke="none">
          {caption}
        </text>
      )}
    </g>
  );
}

/** A row of simple plants standing on the ground line. */
function Plants({ xs }: { xs: number[] }) {
  return (
    <g stroke="#e9c79b" strokeWidth={0.05} strokeLinecap="round" fill="none">
      <line x1={-3.2} y1={-GROUND_Y} x2={3.2} y2={-GROUND_Y} strokeOpacity={0.5} />
      {xs.map((x, k) => {
        const h = 1.3 + ((k * 7) % 5) * 0.4, lean = k % 2 ? 0.25 : -0.2;
        return (
          <g key={x}>
            <path d={`M${x} ${-GROUND_Y} Q${x} ${-GROUND_Y - h * 0.6} ${x + lean} ${-GROUND_Y - h}`} />
            <ellipse cx={x + 0.2} cy={-GROUND_Y - h * 0.45} rx={0.18} ry={0.07} fill="#e9c79b" fillOpacity={0.5} stroke="none" />
            <circle cx={x + lean} cy={-GROUND_Y - h} r={0.2} fill="#ffb469" stroke="none" />
          </g>
        );
      })}
    </g>
  );
}

function NetDrawing() {
  return (
    <>
      <g stroke="#8fb8ff" strokeWidth={0.012} strokeOpacity={0.45}>
        {NET_COLUMNS.slice(0, -1).flatMap((col, l) =>
          col.flatMap((a, i) =>
            NET_COLUMNS[l + 1].map((b, j) => <line key={`${l}-${i}-${j}`} x1={a[0]} y1={-a[1]} x2={b[0]} y2={-b[1]} />),
          ),
        )}
      </g>
      {NET_COLUMNS.flat().map((n, i) => (
        <circle key={i} cx={n[0]} cy={-n[1]} r={0.1} fill="#8fb8ff" />
      ))}
    </>
  );
}

export default function Fallback2D({ sceneKey, compute, net, beams, fragment, onFragment, alarmStage, allowed }: Props) {
  const spec = SPECS[sceneKey];
  const interact = { compute, boost: 1 };
  const structure = spec.structure(interact);
  const density = spec.density(interact);
  const { dots, links } = useMemo(() => {
    let a = 7;
    const rand = () => {
      a = (a * 16807) % 2147483647;
      return a / 2147483647;
    };
    const dots = Array.from({ length: 150 }, () => {
      const r = Math.sqrt(rand()) * 1.9, t = rand() * Math.PI * 2;
      return { x: Math.cos(t) * r, y: Math.sin(t) * r * 0.9, rank: rand(), size: 0.02 + rand() * 0.04 };
    });
    const hubs = dots.slice(0, 26);
    const links: number[][] = [];
    hubs.forEach((h, i) => {
      const near = hubs
        .map((o, j) => ({ j, d: Math.hypot(o.x - h.x, o.y - h.y) }))
        .filter((e) => e.j > i)
        .sort((p, q) => p.d - q.d)
        .slice(0, 2);
      near.forEach((n) => links.push([h.x, h.y, hubs[n.j].x, hubs[n.j].y]));
    });
    return { dots, links };
  }, []);
  const wheel = spec.shape === "wheel";
  if (spec.shape === "flow") {
    return (
      <svg className="fallback" viewBox="-4.6 -4.6 9.2 9.2" role="img" aria-label="A flowchart of boxes and arrows">
        <g fill="none" stroke="#e4ddcf" strokeWidth={0.03} strokeOpacity={0.8}>
          {FLOW_BOXES.map((b) => (
            <rect key={b.label} x={b.x - b.w / 2} y={-b.y - 0.35} width={b.w} height={0.7} />
          ))}
          <path d="M0 -1.15 L1 -0.55 L0 0.05 L-1 -0.55 Z M0 -1.65 V-1.15 M-1 -0.55 H-1.6 V0.45 M1 -0.55 H1.6 V0.45 M-1.6 1.15 V1.6 H1.6 V1.15 M0 1.6 V1.95" />
        </g>
        {FLOW_BOXES.map((b) => (
          <text key={b.label} x={b.x} y={-b.y + 0.11} textAnchor="middle" fontSize={0.3} fill="#e4ddcf" fontFamily="monospace">
            {b.label}
          </text>
        ))}
      </svg>
    );
  }
  if (spec.shape === "net") {
    return (
      <svg className="fallback" viewBox="-4.6 -4.6 9.2 9.2" role="img" aria-label="A network of connected nodes">
        <NetDrawing />
        {net &&
          NET_COLUMNS[3].map((n, k) => {
            const word = 2 - k;
            const picked = net.chosen === word;
            return (
              <text key={k} x={n[0] + 0.3} y={-n[1] + 0.11} fontSize={0.32} fill={picked ? (net.right ? "#ffffff" : "#ff8266") : "#f3ede2"} fillOpacity={picked ? 1 : 0.6}>
                {net.words[word]}
              </text>
            );
          })}
      </svg>
    );
  }
  if (spec.shape === "bars") {
    const focus = sceneKey === "bars3";
    const poly = (key: "theory" | "used") =>
      RADAR.map((r, k) => {
        const v = Math.max(r[key], 0.01) * RADAR_SCALE;
        return `${(Math.cos(radarAngle(k)) * v).toFixed(3)},${(-Math.sin(radarAngle(k)) * v).toFixed(3)}`;
      }).join(" ");
    return (
      <svg className="fallback" viewBox="-4.6 -4.6 9.2 9.2" role="img" aria-label="A radar chart of what AI could do in theory and what it is actually used for, by kind of work">
        <g transform="scale(1.15)">
          <circle r={RADAR_SPOKE} fill="none" stroke="#e4ddcf" strokeOpacity={0.25} strokeWidth={0.02} />
          {RADAR.map((r, k) => (
            <line
              key={r.label}
              x2={Math.cos(radarAngle(k)) * RADAR_SPOKE}
              y2={-Math.sin(radarAngle(k)) * RADAR_SPOKE}
              stroke={focus && r.human ? "#ffb469" : "#e4ddcf"}
              strokeOpacity={focus && r.human ? 0.9 : 0.2}
              strokeWidth={focus && r.human ? 0.05 : 0.015}
            />
          ))}
          <polygon points={poly("theory")} fill="#8fb8ff" fillOpacity={0.25} stroke="#8fb8ff" strokeWidth={0.03} />
          <polygon points={poly("used")} fill="#f3ede2" fillOpacity={0.8} />
          {RADAR.map((r, k) =>
            r.key ? (
              <text
                key={r.label}
                x={Math.cos(radarAngle(k)) * RADAR_LABEL}
                y={-Math.sin(radarAngle(k)) * RADAR_LABEL + 0.08}
                textAnchor="middle"
                fontSize={0.2}
                fill={focus && r.human ? "#ffb469" : "#f3ede2"}
              >
                {r.label}
              </text>
            ) : null,
          )}
        </g>
      </svg>
    );
  }
  if (spec.shape === "garden") {
    return (
      <svg className="fallback" viewBox="-4.6 -4.6 9.2 9.2" role="img" aria-label="A garden growing">
        <g transform="translate(0 0.5) scale(1.25)">
          <Plants xs={[-2.6, -1.9, -1.25, -0.6, 0, 0.65, 1.3, 1.9, 2.55]} />
          {RENAMES.map((r, k) => (
            <text key={r.now} x={GARDEN_SPOTS[k][0]} y={-GARDEN_SPOTS[k][1] - 0.9} textAnchor="middle" fontSize={0.36} fill="#ffd9a8">
              {r.now}
            </text>
          ))}
        </g>
      </svg>
    );
  }
  if (spec.shape === "together") {
    return (
      <svg className="fallback" viewBox="-4.6 -4.6 9.2 9.2" role="img" aria-label="Two people at a shared table in a garden">
        <g transform="translate(0 0.4) scale(1.25)">
          <Plants xs={[-2.75, -2.2, 2.2, 2.75]} />
          <g transform={`translate(0 ${-GROUND_Y - 1.27}) scale(0.72)`}>
            <FigureDrawing x={-1.8} damaged={false} warm />
            <FigureDrawing x={1.8} damaged={false} warm />
          </g>
          <ellipse cy={-GROUND_Y - 0.95} rx={0.62} ry={0.1} fill="#e4ddcf" fillOpacity={0.7} />
          <line x1={0} y1={-GROUND_Y - 0.95} x2={0} y2={-GROUND_Y} stroke="#e4ddcf" strokeWidth={0.06} />
        </g>
      </svg>
    );
  }
  if (spec.shape === "whole") {
    return (
      <svg className="fallback" viewBox="-4.6 -4.6 9.2 9.2" role="img" aria-label="The network, the garden and the text as one form">
        <ellipse cy={-1.2} rx={3.2} ry={0.8} fill="none" stroke="#e4ddcf" strokeOpacity={0.5} strokeWidth={0.04} strokeDasharray="0.3 0.18" />
        {dots.slice(0, 90).map((d, i) => (
          <circle key={i} cx={d.x * 0.75} cy={d.y * 0.75 - 0.25} r={d.size} fill="#8fb8ff" opacity={0.8} />
        ))}
        <g transform="scale(0.85) translate(0 0.4)">
          <Plants xs={[-2.4, -1.5, -0.6, 0.6, 1.5, 2.4]} />
        </g>
      </svg>
    );
  }
  if (spec.shape === "figure" || spec.shape === "figures") {
    const pair = spec.shape === "figures";
    const story = sceneKey === "pairStory";
    return (
      <svg className="fallback" viewBox="-4.6 -4.6 9.2 9.2" role="img" aria-label="Abstract figures standing side by side">
        <g transform="translate(0 0.6) scale(1.25)">
          {!pair && <FigureDrawing x={0} damaged={sceneKey === "figureRot"} />}
          {pair && (
            <>
              <FigureDrawing x={-FIGURE_X} damaged caption={story ? FIGURE_LABELS.storyBad : undefined} />
              <FigureDrawing
                x={FIGURE_X}
                damaged={!story && !allowed}
                caption={story ? FIGURE_LABELS.storyGame : allowed ? FIGURE_LABELS.added : undefined}
              />
            </>
          )}
        </g>
      </svg>
    );
  }
  if (spec.shape === "stream") {
    const warm = sceneKey !== "stream";
    return (
      <svg className="fallback" viewBox="-4.6 -4.6 9.2 9.2" aria-label="Fragments of text flowing into a network">
        <g stroke={warm ? "#ffb469" : "#e4ddcf"} strokeWidth={0.035} strokeOpacity={0.5} strokeLinecap="round">
          {dots.slice(0, 90).map((d, i) => {
            const a = d.rank * Math.PI * 2, r = 1.9 + d.size * 45;
            const x = Math.cos(a) * r, y = Math.sin(a) * r;
            return <path key={i} d={`M${x - 0.18} ${y} h0.14 m0.05 0 h0.17 M${x - 0.18} ${y + 0.09} h0.24`} />;
          })}
        </g>
        <g transform={`scale(0.5) translate(${-NET_CENTER_X} 0)`}>
          <NetDrawing />
        </g>
        {sceneKey === "stream" &&
          FRAGMENT_SPOTS.map((p, k) => (
            <g
              key={k}
              role="button"
              tabIndex={0}
              aria-label={`Read fragment ${k + 1}: ${FRAGMENTS[k].kind}`}
              onClick={() => onFragment(k)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onFragment(k)}
              style={{ cursor: "pointer" }}
            >
              <circle cx={p[0]} cy={-p[1]} r={0.5} fill="#ffb469" fillOpacity={fragment === k ? 0.25 : 0.001} />
              <path
                d={`M${p[0] - 0.2} ${-p[1] - 0.1} h0.4 M${p[0] - 0.2} ${-p[1]} h0.28 M${p[0] - 0.2} ${-p[1] + 0.1} h0.34`}
                stroke="#ffb469"
                strokeWidth={0.05}
                strokeLinecap="round"
              />
            </g>
          ))}
      </svg>
    );
  }
  if (spec.shape === "beams") {
    const all = sceneKey === "beamsAll";
    const showBeams = sceneKey !== "concept";
    return (
      <svg className="fallback" viewBox="-4.6 -4.6 9.2 9.2" role="img" aria-label="Three beams meeting at one point">
        {dots.slice(0, 70).map((d, i) => (
          <circle key={i} cx={d.x * 0.5} cy={d.y * 0.5} r={d.size * 0.7} fill="#8fb8ff" opacity={0.6} />
        ))}
        {showBeams &&
          LANGUAGES.map((l, k) => {
            const x = Math.cos(BEAM_ANGLES[k]) * BEAM_LENGTH, y = -Math.sin(BEAM_ANGLES[k]) * BEAM_LENGTH;
            const lit = all || beams.picked === k;
            const ty = y < 0 ? y - 0.75 : y + 0.5;
            return (
              <g key={l.name}>
                <line x1={x} y1={y} x2={0} y2={0} stroke="#e4ddcf" strokeWidth={lit ? 0.06 : 0.02} strokeOpacity={lit ? 0.9 : 0.4} />
                <text x={x} y={ty} textAnchor="middle" fontSize={0.27} fill="#f3ede2" fillOpacity={lit ? 1 : 0.6} lang={l.lang}>
                  {l.question}
                </text>
                {(all || beams.answered[k]) && (
                  <text x={x} y={ty + 0.42} textAnchor="middle" fontSize={0.36} fontWeight={700} fill="#ffffff" lang={l.lang}>
                    {l.answer}
                  </text>
                )}
              </g>
            );
          })}
        <circle r={0.2} fill="#fff1d6" opacity={all || beams.coreLit || !showBeams ? 1 : 0.3} />
        {(all || (showBeams && beams.coreLit)) && (
          <text x={0.35} y={0.1} fontSize={0.3} fill="#ffb469">
            {CONCEPT_LABEL}
          </text>
        )}
      </svg>
    );
  }
  return (
    <svg className="fallback" viewBox="-4.6 -4.6 9.2 9.2" role="img" aria-label="Illustration of the scene">
      <g transform={wheel ? "scale(0.7)" : undefined}>
        <g stroke="#8fb8ff" strokeWidth={0.012} opacity={structure * 0.7}>
          {links.map((l, i) => (
            <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} />
          ))}
        </g>
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.size} fill="#8fb8ff" opacity={d.rank < density ? 0.85 : 0.08} />
        ))}
      </g>
      {hotRegions(sceneKey, 0, alarmStage >= 2 ? 1 : 0, true).map((h, i) => (
        <circle key={i} cx={h.pos[0]} cy={-h.pos[1]} r={h.r} fill={h.color} opacity={0.35 * h.amt} />
      ))}
      {sceneKey === "alarm" && (
        <>
          {alarmStage >= 1 && (
            <text y={-2.5} textAnchor="middle" fontSize={0.3} fill="#f3ede2">
              {ALARM.message}
            </text>
          )}
          {alarmStage >= 3 && (
            <text y={2.8} textAnchor="middle" fontSize={0.34} fontWeight={700} fill="#ffffff">
              {ALARM.reply}
            </text>
          )}
        </>
      )}
      {wheel && (
        <g>
          <circle r={WHEEL_RADIUS} fill="none" stroke="#f3ede2" strokeOpacity={0.35} strokeWidth={0.03} />
          {WHEEL_STATIONS.map((name, k) => {
            const x = Math.cos(STATION_ANGLES[k]) * WHEEL_RADIUS;
            const y = -Math.sin(STATION_ANGLES[k]) * WHEEL_RADIUS;
            return (
              <g key={name}>
                <circle cx={x} cy={y} r={0.16} fill={k === 2 ? "#ffb469" : "#8fb8ff"} />
                <text x={x} y={y + (y > 0.1 ? 0.55 : -0.32)} textAnchor="middle" fontSize={0.34} fill="#f3ede2">
                  {name}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}
