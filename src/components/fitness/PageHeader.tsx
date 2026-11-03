import ThemeToggle from "./ThemeToggle";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function PageHeader({
  title,
  detail,
  backHref,
  backLabel = "Back",
}: {
  title: string;
  detail?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="page-header">
      <div>
        {backHref && (
          <a className="page-back" href={backHref} aria-label={backLabel}>
            <ArrowLeftIcon aria-hidden="true" />
          </a>
        )}
        <h1>{title}</h1>
        {detail && <span>{detail}</span>}
      </div>
      <ThemeToggle />
    </header>
  );
}
