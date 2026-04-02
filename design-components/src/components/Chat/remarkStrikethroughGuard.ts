import type { Root, Delete, PhrasingContent } from 'mdast';
import { visit, SKIP } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';

/**
 * Remark plugin that prevents false-positive strikethrough when single tildes
 * are used as "approximately" (e.g. ~$29K ... ~$480K).
 *
 * If the text content of a strikethrough node starts or ends with whitespace,
 * it's almost certainly a mis-parse — unwrap it back to plain text with
 * literal ~ characters restored.
 *
 * Double-tilde (~~real strikethrough~~) and tight single-tilde (~word~) are
 * unaffected.
 */
export function remarkStrikethroughGuard() {
  return (tree: Root) => {
    visit(tree, 'delete', (node: Delete, index, parent) => {
      if (index == null || !parent) return;

      const text = toString(node);
      if (text.startsWith(' ') || text.endsWith(' ')) {
        // Unwrap: replace the delete node with ~<children>~
        const replacement: PhrasingContent[] = [
          { type: 'text', value: '~' },
          ...node.children,
          { type: 'text', value: '~' },
        ];
        parent.children.splice(index, 1, ...replacement);
        return [SKIP, index];
      }
    });
  };
}
