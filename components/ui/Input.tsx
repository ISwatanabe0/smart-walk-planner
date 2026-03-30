type InputProps = {
  id?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  label?: string;
  disabled?: boolean;
  step?: string | number;
  min?: number;
};

export function Input({
  id,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  label,
  disabled = false,
  step,
  min,
}: InputProps) {
  return (
    <div className="form-group">
      {label !== undefined && (
        <label className="form-label" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        className="form-input"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        step={step}
        min={min}
      />
      {error !== undefined && <p className="form-error">{error}</p>}
    </div>
  );
}
