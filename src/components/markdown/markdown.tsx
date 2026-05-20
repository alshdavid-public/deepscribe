import { h } from "preact";
import { useMemo } from "preact/hooks";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface MarkdownProps {
  contents: string;
  className?: string;
}

export function Markdown({ contents, className }: MarkdownProps) {
  const htmlContent = useMemo(() => {
    if (!contents) return "";

    const rawHtml = marked.parse(contents, {
      breaks: true,
      gfm: true,
    }) as string;

    return DOMPurify.sanitize(rawHtml);
  }, [contents]);

  return (
    <div
      className={["markdown-component", ...(className ? [className] : [])].join(
        " ",
      )}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

// import { h } from "preact";
// import { useMemo } from "preact/hooks";
// import { useLazyModule } from "../../platform/preact/use-lazy-module.ts";

// interface MarkdownProps {
//   contents: string;
//   className?: string;
// }

// export function Markdown({ contents, className }: MarkdownProps) {
//   const marked = useLazyModule(() => import('marked'))
//   const DOMPurify = useLazyModule(() => import('dompurify'))

//   const htmlContent = useMemo(() => {
//     console.log({marked, DOMPurify})
//     if (!contents) return "";
//     if (!marked) return "";
//     if (!DOMPurify) return "";

//     const rawHtml = marked.parse(contents, {
//       breaks: true,
//       gfm: true,
//     }) as string;

//     return DOMPurify.default.sanitize(rawHtml);
//   }, [contents, marked, DOMPurify]);

//   return (
//     <div
//       className={["markdown-component", ...(className ? [className] : [])].join(
//         " ",
//       )}
//       dangerouslySetInnerHTML={{ __html: htmlContent }}
//     />
//   );
// }
