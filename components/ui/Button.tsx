type ButtonVariant = "primary" | "secondary";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

export function Button({
  children,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
  fullWidth = false,
}: ButtonProps) {
  const classes = [
    "btn",
    `btn-${variant}`,
    fullWidth ? "btn-full" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
