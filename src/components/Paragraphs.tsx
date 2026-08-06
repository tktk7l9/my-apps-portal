import { toParagraphs } from "@/lib/paragraphs";

/** 説明文を段落に分けて描画する。フックを使わないのでサーバー/クライアント両方から使える。 */
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
        // 静的なテキストで並び替えが起きないため index キーで問題ない
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
