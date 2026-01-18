import ListItem from '@tiptap/extension-list-item';

/**
 * Custom ListItem extension with Shift+Enter behavior:
 * - Shift+Enter creates a new list item
 * - Shift+Enter on an empty list item exits the list completely (like Slack)
 * - Tab indents the list item
 * - Shift+Tab outdents the list item
 */
export const CustomListItem = ListItem.extend({
  addKeyboardShortcuts() {
    return {
      'Shift-Enter': ({ editor }) => {
        // Check if current list item is empty - if so, exit the list completely
        const { $from } = editor.state.selection;

        // Find the list item node and its parent list
        let listItemDepth = -1;
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === 'listItem') {
            listItemDepth = d;
            break;
          }
        }

        if (listItemDepth === -1) {
          return false;
        }

        const listItem = $from.node(listItemDepth);

        // If the list item content is empty, exit the list completely
        if (listItem.textContent === '') {
          const listDepth = listItemDepth - 1;
          const list = $from.node(listDepth);
          const listItemIndex = $from.index(listDepth);
          const isLastItem = listItemIndex === list.childCount - 1;
          const isOnlyItem = list.childCount === 1;

          if (isOnlyItem) {
            // If this is the only item, delete the entire list and insert a paragraph
            return editor
              .chain()
              .deleteNode(list.type.name)
              .insertContent({ type: 'paragraph' })
              .focus()
              .run();
          } else if (isLastItem) {
            // If this is the last item, delete it and insert paragraph after the list
            const listEnd = $from.after(listDepth);
            return editor
              .chain()
              .deleteNode('listItem')
              .insertContentAt(listEnd - 2, { type: 'paragraph' })
              .focus()
              .run();
          } else {
            // If in the middle, just lift out (split the list)
            return editor.commands.liftListItem(this.name);
          }
        }

        // Otherwise, create a new list item
        return editor.commands.splitListItem(this.name);
      },
      Tab: () => this.editor.commands.sinkListItem(this.name),
      'Shift-Tab': () => this.editor.commands.liftListItem(this.name),
    };
  },
});
