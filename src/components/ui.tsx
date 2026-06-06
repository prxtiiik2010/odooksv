import { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="page-actions">{action}</div>}
    </header>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="spinner-wrap" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="state-card state-card-loading">
      <Spinner label={message} />
    </div>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="state-card">
      <div className="state-icon">○</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="state-action">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message = "Please try again in a moment.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="state-card state-card-error" role="alert">
      <div className="state-icon">!</div>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}

export function TableContainer({ children }: { children: ReactNode }) {
  return <div className="table-container">{children}</div>;
}

export function formatCurrency(value?: number | null) {
  return `Rs. ${(value ?? 0).toLocaleString()}`;
}

export function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}
