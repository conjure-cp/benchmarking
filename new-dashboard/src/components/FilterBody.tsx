import { TIME_FIELDS, type FilterRule, type FilterOperation, type TimeField } from "../lib/benchmark";

export type { FilterRule, FilterOperation } from "../lib/benchmark";

interface Props {
  rules: FilterRule[];
  onChange: (rules: FilterRule[]) => void;
}

export function FilterBody({ rules, onChange }: Props) {
  const update = (id: string, patch: Partial<FilterRule>) =>
    onChange(rules.map((rule) => rule.id === id ? { ...rule, ...patch } : rule));

  return (
    <div className="advanced-filters">
      <div className="filter-header">
        <div>
          <strong>Time filters</strong>
          <p>Combine conditions; timings are entered in seconds.</p>
        </div>
        <div className="action-row">
          <button className="text-button" onClick={() => onChange([])} disabled={!rules.length}>Clear rules</button>
          <button className="button button-secondary" onClick={() => onChange([...rules, { id: crypto.randomUUID(), property: "total_time", operation: "gt", value: null }])}>+ Add condition</button>
        </div>
      </div>
      {rules.length === 0 && <p className="empty-rule">No advanced conditions applied.</p>}
      {rules.map((rule) => (
        <div className="filter-rule" key={rule.id}>
          <select aria-label="Timing field" value={rule.property} onChange={(e) => update(rule.id, { property: e.target.value as TimeField })}>
            {TIME_FIELDS.map(({key, label}) => <option key={key} value={key}>{label}</option>)}
          </select>
          <select aria-label="Comparison" value={rule.operation} onChange={(e) => update(rule.id, { operation: e.target.value as FilterOperation })}>
            <option value="gt">Greater than</option>
            <option value="lt">Less than</option>
            <option value="eq">Equal to</option>
          </select>
          <input aria-label="Threshold in seconds" type="number" min="0" step="any" placeholder="Seconds" value={rule.value ?? ""} onChange={(e) => update(rule.id, { value: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })} />
          <button className="icon-button" aria-label="Remove condition" title="Remove condition" onClick={() => onChange(rules.filter((candidate) => candidate.id !== rule.id))}>×</button>
        </div>
      ))}
    </div>
  );
}
