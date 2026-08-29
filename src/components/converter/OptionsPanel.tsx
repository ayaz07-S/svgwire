import type { ConversionOptions } from '../../lib/templates/index';
import { toPascalCase } from '../../lib/utils';

interface OptionsPanelProps {
  options: ConversionOptions;
  onChange: (key: keyof ConversionOptions, value: unknown) => void;
  framework: string;
}

function Toggle({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2.5 cursor-pointer select-none group"
    >
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border border-hairline transition-colors duration-200 ${
          checked ? 'bg-ink border-ink' : 'bg-canvas-soft-2'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-canvas shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
      <span className="text-body-sm text-body group-hover:text-ink transition-colors duration-150">
        {label}
      </span>
    </label>
  );
}

export function OptionsPanel({ options, onChange, framework }: OptionsPanelProps) {
  return (
    <div className="rounded-lg bg-canvas shadow-level-1 border border-hairline px-4 py-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-wrap">
        {/* Component Name */}
        <div className="flex items-center gap-2">
          <label htmlFor="component-name" className="text-caption-mono text-mute whitespace-nowrap">
            Name
          </label>
          <input
            id="component-name"
            type="text"
            value={options.componentName}
            onChange={e => onChange('componentName', toPascalCase(e.target.value) || 'SvgIcon')}
            className="h-7 rounded-sm border border-hairline bg-canvas px-2 text-body-sm text-ink outline-none focus:border-ink transition-colors duration-150 w-28"
            spellCheck={false}
          />
        </div>

        <div className="h-5 w-px bg-hairline hidden sm:block" />

        {/* Toggles */}
        <Toggle
          id="toggle-typescript"
          checked={options.typescript}
          onChange={v => onChange('typescript', v)}
          label="TypeScript"
        />

        <Toggle
          id="toggle-remove-dims"
          checked={options.removeDimensions}
          onChange={v => onChange('removeDimensions', v)}
          label="Remove dimensions"
        />

        <Toggle
          id="toggle-current-color"
          checked={options.useCurrentColor}
          onChange={v => onChange('useCurrentColor', v)}
          label="currentColor"
        />

        {(framework === 'react' || framework === 'tailwind-react') && (
          <Toggle
            id="toggle-classname"
            checked={options.addClassName}
            onChange={v => onChange('addClassName', v)}
            label="className prop"
          />
        )}

        {framework === 'react-native' && (
          <Toggle
            id="toggle-nativewind"
            checked={options.nativewind}
            onChange={v => onChange('nativewind', v)}
            label="NativeWind"
          />
        )}
      </div>
    </div>
  );
}
