import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Activity, TrendingDown, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Scenario, QuizOption } from '../data/scenarios';

export interface ScenarioOutcome {
  scenarioId: string;
  winningOption: QuizOption;
  votes: { 1: number; 2: number; 3: number };
  totalVotes: number;
}

interface EpidemicCurveCanvasProps {
  scenarios: Scenario[];
  currentScenarioIndex: number;
  outcomes: Record<string, ScenarioOutcome>; // Outcomes locked in so far
  isVotingClosedForCurrent: boolean;
  currentWinningOption?: QuizOption | null;
}

interface DataPoint {
  day: number;
  scenarioIndex: number;
  scenarioTitle: string;
  cases: number;
  counterfactualCases?: number; // what would have happened without intervention
  isInterventionPoint?: boolean;
  isLocked: boolean;
}

export const EpidemicCurveCanvas: React.FC<EpidemicCurveCanvasProps> = ({
  scenarios,
  currentScenarioIndex,
  outcomes,
  isVotingClosedForCurrent,
  currentWinningOption,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  // Trigger smooth bend animation when voting closes or winning option changes
  useEffect(() => {
    let start: number | null = null;
    let animId: number;

    setAnimationProgress(0);

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(1, elapsed / 700); // 700ms smooth bend
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimationProgress(ease);

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isVotingClosedForCurrent, currentWinningOption?.id, currentScenarioIndex]);

  // Compute curve trajectory across all 3 scenarios (30 days total, 10 days each)
  const curvePoints: DataPoint[] = useMemo(() => {
    const points: DataPoint[] = [];
    let runningCaseload = 70; // Day 1 baseline

    scenarios.forEach((scenario, sIdx) => {
      const isPastScenario = sIdx < currentScenarioIndex;
      const isCurrent = sIdx === currentScenarioIndex;
      const isFuture = sIdx > currentScenarioIndex;

      // Determine winning option effect for this scenario
      let activeOption: QuizOption | null = null;
      if (outcomes[scenario.id]) {
        activeOption = outcomes[scenario.id].winningOption;
      } else if (isCurrent && isVotingClosedForCurrent && currentWinningOption) {
        activeOption = currentWinningOption;
      }

      // Pre-intervention rise: Days 1 to 5 of the scenario
      const startDay = scenario.dayStart;
      const midDay = startDay + 4; // Day 5 of this scenario
      const endDay = scenario.dayEnd;

      // Base caseload at start of scenario (carries over from previous scenario)
      if (sIdx > 0) {
        // Carryover: start from last day's caseload of previous scenario,
        // with slight seasonal/cluster adjustment
        runningCaseload = Math.max(30, Math.round(runningCaseload * 1.1));
      }

      // Pre-intervention growth points (Days 1–5)
      for (let day = startDay; day <= midDay; day++) {
        const step = day - startDay;
        // Exponential-like rise during uncontrolled phase
        const dailyCases = Math.round(runningCaseload * (1 + step * 0.16));
        points.push({
          day,
          scenarioIndex: sIdx,
          scenarioTitle: scenario.category,
          cases: isFuture ? 0 : dailyCases,
          isLocked: isPastScenario || (isCurrent && day <= midDay),
        });
      }

      const preInterventionPeak = points[points.length - 1].cases;

      // Post-intervention trajectory: Days 6 to 10
      for (let day = midDay + 1; day <= endDay; day++) {
        const postStep = day - midDay; // 1, 2, 3, 4, 5
        const t = postStep / 5;

        // Counterfactual baseline (if nothing was done / no intervention)
        const counterfactual = Math.round(preInterventionPeak * (1 + postStep * 0.22));

        let actualCases = 0;

        if (isPastScenario && activeOption) {
          // Locked in historic scenario
          const effectMultiplier = 1 + (activeOption.infectionEffect / 100);
          const targetEnd = Math.max(15, Math.round(preInterventionPeak * effectMultiplier));
          actualCases = Math.round(preInterventionPeak + (targetEnd - preInterventionPeak) * t);
        } else if (isCurrent) {
          if (isVotingClosedForCurrent && activeOption) {
            // Actively bending according to winning choice with animation progress
            const effectMultiplier = 1 + (activeOption.infectionEffect / 100);
            const targetEnd = Math.max(15, Math.round(preInterventionPeak * effectMultiplier));
            const fullBended = preInterventionPeak + (targetEnd - preInterventionPeak) * t;
            // Interpolate from unbent (counterfactual) to bended based on animationProgress
            actualCases = Math.round(
              counterfactual + (fullBended - counterfactual) * animationProgress
            );
          } else {
            // Still voting: project upward impending surge
            actualCases = Math.round(preInterventionPeak * (1 + postStep * 0.12));
          }
        }

        points.push({
          day,
          scenarioIndex: sIdx,
          scenarioTitle: scenario.category,
          cases: isFuture ? 0 : actualCases,
          counterfactualCases: counterfactual,
          isInterventionPoint: day === midDay + 1,
          isLocked: isPastScenario,
        });
      }

      // Update running caseload carryover for next scenario
      runningCaseload = points[points.length - 1].cases;
    });

    return points;
  }, [
    scenarios,
    currentScenarioIndex,
    outcomes,
    isVotingClosedForCurrent,
    currentWinningOption,
    animationProgress,
  ]);

  // Render on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    const padding = { top: 32, right: 36, bottom: 44, left: 54 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Filter points visible up to current scenario's end
    const visiblePoints = curvePoints.filter(
      (p) => p.scenarioIndex <= currentScenarioIndex
    );

    if (visiblePoints.length === 0) return;

    // Determine Y range
    const maxCaseVal = Math.max(
      220,
      ...visiblePoints.map((p) => Math.max(p.cases, p.counterfactualCases || 0))
    );
    const maxY = Math.ceil(maxCaseVal / 50) * 50;

    const getX = (day: number) => {
      // 30 days total
      return padding.left + ((day - 1) / 29) * chartW;
    };

    const getY = (cases: number) => {
      return padding.top + chartH - (cases / maxY) * chartH;
    };

    // Draw scenario vertical separator bands & labels
    scenarios.forEach((s, idx) => {
      const xStart = getX(s.dayStart);
      const xEnd = getX(s.dayEnd);
      const bandW = xEnd - xStart;

      // Alternate subtle band tint
      if (idx % 2 === 1) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
        ctx.fillRect(xStart, padding.top, bandW, chartH);
      }

      // Vertical scenario partition lines
      if (idx > 0) {
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(xStart, padding.top);
        ctx.lineTo(xStart, padding.top + chartH);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Scenario zone headers
      ctx.fillStyle = idx === currentScenarioIndex ? '#38bdf8' : '#64748b';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `SCENARIO ${idx + 1}: ${s.pathogen.toUpperCase()}`,
        xStart + 6,
        padding.top - 12
      );
    });

    // Draw Horizontal Grid lines & Y-axis labels
    const ySteps = 4;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '500 10px "JetBrains Mono", monospace';

    for (let i = 0; i <= ySteps; i++) {
      const val = Math.round((maxY / ySteps) * i);
      const y = getY(val);

      ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.fillText(`${val}`, padding.left - 8, y);
    }

    // Draw X-axis Days labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let day = 1; day <= 30; day += 3) {
      const x = getX(day);
      ctx.fillStyle = '#64748b';
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillText(`D${day}`, x, padding.top + chartH + 8);
    }

    // Axis line
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartH);
    ctx.lineTo(padding.left + chartW, padding.top + chartH);
    ctx.stroke();

    // 1. Draw Counterfactual "No Intervention" dashed curve if current voting closed
    if (isVotingClosedForCurrent) {
      const currentPoints = visiblePoints.filter((p) => p.scenarioIndex === currentScenarioIndex);
      const counterfactualPoints = currentPoints.filter((p) => p.counterfactualCases !== undefined);

      if (counterfactualPoints.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);

        const startPt = currentPoints.find((p) => p.day === scenarios[currentScenarioIndex].dayStart + 4);
        if (startPt) {
          ctx.moveTo(getX(startPt.day), getY(startPt.cases));
          counterfactualPoints.forEach((p) => {
            ctx.lineTo(getX(p.day), getY(p.counterfactualCases!));
          });
          ctx.stroke();
          ctx.setLineDash([]);

          // Ghost projection text
          const lastCf = counterfactualPoints[counterfactualPoints.length - 1];
          ctx.fillStyle = '#94a3b8';
          ctx.font = '500 10px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('Projected without intervention', getX(lastCf.day) + 4, getY(lastCf.counterfactualCases!) - 6);
        }
      }
    }

    // 2. Draw Shaded Gradient Area under the Actual Epidemic Curve
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    // Dynamic color depending on whether currently bending down or up
    const activeEffect = currentWinningOption?.infectionEffect ?? 0;
    const isSuppressed = isVotingClosedForCurrent && activeEffect < 0;

    if (isSuppressed) {
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
    } else if (isVotingClosedForCurrent && activeEffect > 0) {
      gradient.addColorStop(0, 'rgba(244, 63, 94, 0.35)');
      gradient.addColorStop(1, 'rgba(244, 63, 94, 0.02)');
    } else {
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0.01)');
    }

    ctx.beginPath();
    ctx.moveTo(getX(visiblePoints[0].day), getY(visiblePoints[0].cases));

    for (let i = 1; i < visiblePoints.length; i++) {
      const prev = visiblePoints[i - 1];
      const curr = visiblePoints[i];
      const midX = (getX(prev.day) + getX(curr.day)) / 2;
      ctx.quadraticCurveTo(getX(prev.day), getY(prev.cases), midX, (getY(prev.cases) + getY(curr.cases)) / 2);
    }
    const lastVisible = visiblePoints[visiblePoints.length - 1];
    ctx.lineTo(getX(lastVisible.day), getY(lastVisible.cases));
    ctx.lineTo(getX(lastVisible.day), padding.top + chartH);
    ctx.lineTo(getX(visiblePoints[0].day), padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // 3. Draw Actual Epidemic Curve Solid Line
    ctx.beginPath();
    ctx.moveTo(getX(visiblePoints[0].day), getY(visiblePoints[0].cases));

    for (let i = 1; i < visiblePoints.length; i++) {
      const prev = visiblePoints[i - 1];
      const curr = visiblePoints[i];
      const midX = (getX(prev.day) + getX(curr.day)) / 2;
      const midY = (getY(prev.cases) + getY(curr.cases)) / 2;
      ctx.quadraticCurveTo(getX(prev.day), getY(prev.cases), midX, midY);
    }
    ctx.lineTo(getX(lastVisible.day), getY(lastVisible.cases));

    ctx.lineWidth = 3;
    if (isSuppressed) {
      ctx.strokeStyle = '#10b981'; // Emerald
    } else if (isVotingClosedForCurrent && activeEffect > 0) {
      ctx.strokeStyle = '#f43f5e'; // Rose / Coral
    } else {
      ctx.strokeStyle = '#06b6d4'; // Cyan
    }
    ctx.lineCap = 'round';
    ctx.stroke();

    // 4. Draw Intervention Bend Nodes
    visiblePoints.forEach((p) => {
      // Highlight intervention bend points
      if (p.day === scenarios[p.scenarioIndex].dayStart + 4) {
        const x = getX(p.day);
        const y = getY(p.cases);

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DECISION', x, y - 10);
      }
    });

    // 5. Draw Head Marker Pulse on Current Latest Point
    const headX = getX(lastVisible.day);
    const headY = getY(lastVisible.cases);

    // Glowing halo
    ctx.beginPath();
    ctx.arc(headX, headY, 10, 0, Math.PI * 2);
    ctx.fillStyle = isSuppressed
      ? 'rgba(16, 185, 129, 0.25)'
      : isVotingClosedForCurrent && activeEffect > 0
      ? 'rgba(244, 63, 94, 0.25)'
      : 'rgba(6, 182, 212, 0.25)';
    ctx.fill();

    // Solid core dot
    ctx.beginPath();
    ctx.arc(headX, headY, 5, 0, Math.PI * 2);
    ctx.fillStyle = isSuppressed ? '#10b981' : isVotingClosedForCurrent && activeEffect > 0 ? '#f43f5e' : '#06b6d4';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Latest active cases callout tag
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${lastVisible.cases} cases`, headX + 12, headY - 2);
  }, [curvePoints, currentScenarioIndex, isVotingClosedForCurrent, currentWinningOption, animationProgress]);

  // Handle canvas mouse move for interactive inspection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const padding = { top: 32, right: 36, bottom: 44, left: 54 };
    const chartW = rect.width - padding.left - padding.right;

    if (x < padding.left || x > rect.width - padding.right) {
      setHoveredPoint(null);
      return;
    }

    const dayFraction = (x - padding.left) / chartW;
    const targetDay = Math.min(30, Math.max(1, Math.round(dayFraction * 29 + 1)));

    const found = curvePoints.find(
      (p) => p.day === targetDay && p.scenarioIndex <= currentScenarioIndex
    );
    setHoveredPoint(found || null);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const currentCases = useMemo(() => {
    const active = curvePoints.filter((p) => p.scenarioIndex <= currentScenarioIndex);
    return active.length > 0 ? active[active.length - 1].cases : 70;
  }, [curvePoints, currentScenarioIndex]);

  const activeEffect = currentWinningOption?.infectionEffect ?? 0;

  return (
    <div
      ref={containerRef}
      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4"
    >
      {/* Chart Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Live Epidemic Curve (Epi-Curve)
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                · Continuous Multi-Scenario Trajectory
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Infection count bends according to audience decision and carries over seamlessly to subsequent scenarios.
            </p>
          </div>
        </div>

        {/* Live Metrics Strip */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-slate-400">Active Caseload:</span>
            <span className="font-bold text-white text-sm tabular-nums">{currentCases}</span>
          </div>

          {isVotingClosedForCurrent && currentWinningOption && (
            <div
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                activeEffect < 0
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}
            >
              {activeEffect < 0 ? (
                <TrendingDown className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingUp className="w-4 h-4 text-rose-400" />
              )}
              <span className="font-bold tabular-nums">
                {currentWinningOption.infectionEffectLabel}
              </span>
              <span className="text-[11px] font-sans font-medium">
                {activeEffect < 0 ? 'Suppression' : 'Outbreak Surge'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* HTML5 Canvas Line Chart */}
      <div className="relative w-full h-64 sm:h-72">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full block rounded-xl cursor-crosshair"
        />

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-10 pointer-events-none bg-slate-900/95 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs space-y-1 backdrop-blur-sm -translate-x-1/2 -translate-y-full"
            style={{
              left: `${((hoveredPoint.day - 1) / 29) * 88 + 6}%`,
              top: '40%',
            }}
          >
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>Day {hoveredPoint.day}</span>
              <span className="text-slate-400 font-normal">({hoveredPoint.scenarioTitle})</span>
            </div>
            <div className="text-cyan-400 font-mono font-bold">
              Active Cases: {hoveredPoint.cases}
            </div>
            {hoveredPoint.counterfactualCases && (
              <div className="text-slate-400 font-mono text-[11px]">
                Without Action: {hoveredPoint.counterfactualCases}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart Footer Legend */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60 gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-cyan-400 rounded-full" />
            <span>Active Outbreak Curve</span>
          </div>
          {isVotingClosedForCurrent && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-slate-400" />
              <span>Projected Without Intervention</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Incident Command Decision</span>
          </div>
        </div>

        <div className="text-slate-500 font-mono text-[11px]">
          Days 1–10: Cholera · Days 11–20: Measles · Days 21–30: Malaria
        </div>
      </div>
    </div>
  );
};
