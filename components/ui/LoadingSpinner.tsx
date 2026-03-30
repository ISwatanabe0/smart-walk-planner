type LoadingSpinnerProps = {
  message?: string;
  subMessage?: string;
};

export function LoadingSpinner({
  message = "読み込み中...",
  subMessage,
}: LoadingSpinnerProps) {
  return (
    <div className="spinner-container">
      <div className="spinner" />
      <p>{message}</p>
      {subMessage !== undefined && (
        <p style={{ fontSize: "0.75rem" }}>{subMessage}</p>
      )}
    </div>
  );
}
