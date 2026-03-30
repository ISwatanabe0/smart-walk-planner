import type { RouteTag } from "@/types/route";

type RouteTagsProps = {
  tags: RouteTag[];
};

export function RouteTags({ tags }: RouteTagsProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="tags-list">
      {tags.map((tag) => (
        <span key={tag} className="tag">
          {tag}
        </span>
      ))}
    </div>
  );
}
