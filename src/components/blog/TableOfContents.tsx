import type { Heading } from "@/lib/blog/render";

/** In-page navigation from the article's h2/h3 (SHIG 59). Hidden when there is little to navigate. */
export function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length < 3) return null;

  return (
    <nav aria-labelledby="toc-heading" className="my-8 rounded-xl border border-white/8 bg-white/3 p-4 text-sm">
      <p id="toc-heading" className="mb-2 text-xs font-medium tracking-widest text-muted">
        目次
      </p>
      <ol className="space-y-0.5">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? "pl-4" : ""}>
            <a
              href={`#${heading.id}`}
              className="inline-flex min-h-9 items-center text-slate-300 underline-offset-4 hover:text-white hover:underline"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
