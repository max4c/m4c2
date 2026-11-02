import ThemeToggle from "./ThemeToggle";

export default function PageHeader({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {detail && <span>{detail}</span>}
      </div>
      <ThemeToggle />
    </header>
  );
}
