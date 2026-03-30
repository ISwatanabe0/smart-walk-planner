type ErrorMessageProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
};

export function ErrorMessage({
  title = "エラーが発生しました",
  message,
  onRetry,
  onBack,
}: ErrorMessageProps) {
  return (
    <div className="error-box">
      <p className="error-box-title">{title}</p>
      <p className="error-box-message">{message}</p>
      <div className="error-box-actions">
        {onRetry !== undefined && (
          <button className="btn btn-primary" onClick={onRetry}>
            再試行
          </button>
        )}
        {onBack !== undefined && (
          <button className="btn btn-secondary" onClick={onBack}>
            条件を見直す
          </button>
        )}
      </div>
    </div>
  );
}
