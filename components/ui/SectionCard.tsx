type SectionCardProps = {
  title?: string;
  children: React.ReactNode;
};

export function SectionCard({ title, children }: SectionCardProps) {
  return (
    <div className="section-card">
      {title !== undefined && (
        <p className="section-card-title">{title}</p>
      )}
      {children}
    </div>
  );
}
