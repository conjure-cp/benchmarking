import type { SolveResult } from "../types/SolveResult";
import { formatTime, isMeasured, STAGES, STAGE_COLORS, TIME_FIELDS, type TimeField, type Unit } from "../lib/benchmark";

interface Props {
  rows: SolveResult[];
  metric: TimeField;
  onMetric: (metric: TimeField) => void;
  unit: Unit;
  scale: "linear" | "log";
}

function barPercent(value: number, max: number, scale: "linear" | "log") {
  if (value <= 0 || max <= 0) return 0;
  return Math.max(0, Math.min(100, scale === "log" ? Math.log10(1 + value * 1000) / Math.log10(1 + max * 1000) * 100 : value / max * 100));
}

function nameCell(name: string) { return <span title={name} className="chart-name">{name}</span>; }

export function BenchmarkCharts({ rows, metric, onMetric, unit, scale }: Props) {
  const max = Math.max(0, ...rows.map((row) => isMeasured(row[metric]) ? row[metric] : 0));
  const totalMax = Math.max(0, ...rows.map((row) => isMeasured(row.total_time) ? row.total_time : 0));
  const available = rows.filter((row) => isMeasured(row[metric])).length;
  const stageTotal = rows.reduce((sum, row) => sum + STAGES.reduce((stageSum, stage) => { const value = row[stage.key]; return stageSum + (isMeasured(value) ? value : 0); }, 0), 0);
  const totalTime = rows.reduce((sum, row) => sum + (isMeasured(row.total_time) ? row.total_time : 0), 0);
  const complete = rows.filter((row) => STAGES.every((stage) => isMeasured(row[stage.key]))).length;
  const coverage = totalTime > 0 ? Math.min(100, stageTotal / totalTime * 100) : 0;

  return (
    <section className="analysis-grid" aria-label="Visual benchmark analysis">
      <article className="panel chart-panel">
        <div className="panel-heading">
          <div><h3>Runtime comparison</h3><p>Compare {TIME_FIELDS.find((field) => field.key === metric)?.label.toLowerCase()} across the visible benchmarks.</p></div>
          <span className="chart-count">{available}/{rows.length} measured</span>
        </div>
        <div className="chart-toolbar">
          <label>Measure <select value={metric} onChange={(e) => onMetric(e.target.value as TimeField)}>{TIME_FIELDS.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}</select></label>
          <span className="axis-unit">{unit === "s" ? "seconds" : "milliseconds"}</span>
        </div>
        <div className="chart-axis" aria-hidden="true"><span>0</span><span>{formatTime(max / 2, unit)}</span><span>{formatTime(max, unit)}</span></div>
        <div className="chart-rows">
          {rows.length === 0 && <p className="empty-chart">No benchmarks to chart.</p>}
          {rows.map((row, index) => {
            const value = row[metric];
            const width = isMeasured(value) ? barPercent(value, max, scale) : 0;
            return <div className="chart-row" key={`${row.name}-${index}`}>
              {nameCell(row.name)}
              <div className="bar-track" title={isMeasured(value) ? `${row.name}: ${formatTime(value, unit)} ${unit}` : `${row.name}: not measured`}>
                <div className="bar-fill" style={{ width: `${width}%` }} />
              </div>
              <span className="chart-value">{formatTime(value, unit)}</span>
            </div>;
          })}
        </div>
        <div className="chart-footer"><span className="legend-dot" /> {TIME_FIELDS.find((field) => field.key === metric)?.label}<span className="muted">Lower is faster · {scale} scale</span></div>
      </article>

      <article className="panel chart-panel">
        <div className="panel-heading"><div><h3>Where the time goes</h3><p>Measured phases of each benchmark's execution.</p></div><span className="chart-count">{complete}/{rows.length} fully measured</span></div>
        <div className="chart-toolbar"><span className="chart-tag">Stacked phase breakdown</span><span className="axis-unit">{unit === "s" ? "seconds" : "milliseconds"}</span></div>
        <div className="chart-axis" aria-hidden="true"><span>0</span><span>{formatTime(totalMax / 2, unit)}</span><span>{formatTime(totalMax, unit)}</span></div>
        <div className="chart-rows">
          {rows.length === 0 && <p className="empty-chart">No benchmarks to chart.</p>}
          {rows.map((row, index) => {
            const measuredSum = STAGES.reduce((sum, stage) => { const value = row[stage.key]; return sum + (isMeasured(value) ? value : 0); }, 0);
            const total = isMeasured(row.total_time) ? row.total_time : measuredSum;
            const denominator = Math.max(total, measuredSum);
            const overallWidth = denominator > 0 ? barPercent(denominator, totalMax || denominator, scale) : 0;
            return <div className="chart-row" key={`${row.name}-${index}`}>
              {nameCell(row.name)}
              <div className="bar-track" title={`${row.name}: ${formatTime(total, unit)} ${unit}; measured stages ${formatTime(measuredSum, unit)} ${unit}`}>
                <div className="stack-track" style={{ width: `${overallWidth}%` }}>
                  {STAGES.map((stage) => {
                    const value = row[stage.key];
                    return isMeasured(value) && denominator > 0 && value > 0 ? <span key={stage.key} className="stack-part" style={{ backgroundColor: STAGE_COLORS[stage.key], width: `${value / denominator * 100}%` }} title={`${stage.label}: ${formatTime(value, unit)} ${unit}`} /> : null;
                  })}
                  {denominator > measuredSum && <span className="stack-part unmeasured" style={{ width: `${(denominator - measuredSum) / denominator * 100}%` }} title="Unallocated or not measured" />}
                </div>
              </div>
              <span className="chart-value">{formatTime(total, unit)}</span>
            </div>;
          })}
        </div>
        <div className="stack-legend">{STAGES.map((stage) => <span key={stage.key}><i style={{ background: STAGE_COLORS[stage.key] }} />{stage.shortLabel}</span>)}<span><i className="unmeasured" />Unallocated</span></div>
        <p className="chart-note">Unallocated time is the difference between total runtime and measured stages. Blank CSV fields are not treated as zero.</p>
        <div className="chart-footer"><span className="insight-dot" /> Recorded phases cover {coverage.toFixed(1)}% of total runtime across these rows.</div>
      </article>
    </section>
  );
}
