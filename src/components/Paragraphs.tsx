import { toParagraphs } from "@/lib/paragraphs";

/** Renders a description split into paragraphs. Uses no hooks, so it works from both server and client. */
export function Paragraphs({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const paragraphs = toParagraphs(text);
  if (paragraphs.length === 0) return null;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {paragraphs.map((paragraph, index) => (
        // Static text that never reorders, so an index key is fine
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
