/** Renders copy from site-content.ts, turning each `backtick` span into inline code. */
export function InlineCodeText({ text }: { text: string }) {
  return (
    <>
      {text.split('`').map((part, index) =>
        index % 2 === 1 ? (
          <code
            key={index}
            className="font-mono text-[0.92em] px-1 py-0.5 rounded bg-[var(--bg-glass)] text-[var(--text-primary)] break-words"
          >
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}
