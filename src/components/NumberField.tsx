import { forwardRef, useEffect, useState } from 'react';
import { parseReps, parseWeight, weightText } from '../lib/numbers.ts';

type Props = {
  kind: 'weight' | 'reps';
  value: number | null;
  onChange: (value: number | null) => void;
  label: string;
  done?: boolean;
};

/**
 * Weight or reps box. Keeps its own text while typing (so "132." is allowed
 * mid-entry) and reports parsed numbers upward. Opens the numeric keypad.
 */
const NumberField = forwardRef<HTMLInputElement, Props>(function NumberField({ kind, value, onChange, label, done }, ref) {
  const parse = kind === 'weight' ? parseWeight : parseReps;
  const format = (v: number | null) => (kind === 'weight' ? weightText(v) : v === null ? '' : String(v));
  const [text, setText] = useState(() => format(value));

  // Follow outside changes (prefill, undo) unless the text already means that value.
  useEffect(() => {
    setText((t) => (parse(t) === value || (t === '' && value === null) ? t : format(value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className={kind === 'weight' ? 'num num-weight' : 'num'}>
      <input
        ref={ref}
        className={done ? 'num-input done' : 'num-input'}
        type="text"
        inputMode={kind === 'weight' ? 'decimal' : 'numeric'}
        pattern={kind === 'weight' ? '[0-9]*[.,]?[0-9]*' : '[0-9]*'}
        autoComplete="off"
        enterKeyHint="done"
        aria-label={label}
        value={text}
        onFocus={(e) => {
          // Select so a new number replaces the prefill. iOS needs the delay.
          const el = e.currentTarget;
          setTimeout(() => el.select(), 0);
        }}
        onChange={(e) => {
          const t = e.target.value;
          setText(t);
          if (t.trim() === '') onChange(null);
          else {
            const v = parse(t);
            if (v !== null) onChange(v);
          }
        }}
        onBlur={() => setText(format(value))}
      />
      {kind === 'weight' && (
        <span className="num-unit" aria-hidden="true">
          lb
        </span>
      )}
    </span>
  );
});

export default NumberField;
