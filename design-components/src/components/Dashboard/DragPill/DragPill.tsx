import { DotsSixVerticalIcon } from '@phosphor-icons/react';

/**
 * Inline drag handle shown next to widget chrome in edit mode. Bare
 * dots-six-vertical icon — minimal visual weight, reads as "grip / grab"
 * in any common UI vocabulary.
 *
 * Carries the `widget-drag-handle` class so react-grid-layout's
 * `dragConfig.handle` selector matches only this element. Widget content
 * (chart tooltips, table sorts, etc.) stays interactive.
 *
 * The `label` is kept on the prop for aria-label / tooltip even though it
 * isn't rendered visually — screen readers still announce which widget is
 * being grabbed.
 */
interface DragPillProps {
  label: string;
}

const DragPill: React.FC<DragPillProps> = ({ label }) => (
  <button
    type="button"
    className="widget-drag-handle shrink-0 inline-flex items-center justify-center w-7 h-7 rounded border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-100 hover:border-gray-300 transition-colors"
    aria-label={`Drag ${label}`}
    title="Drag to move"
    // Stop click on the handle so widgets that have their own onClick
    // (e.g. CounterWidget's click-to-drilldown) don't fire a drilldown
    // when the user just clicked the grip. mousedown is intentionally
    // NOT stopped — react-grid-layout listens for it on the grid item to
    // start a drag, and stopping it would break drag.
    onClick={(e) => e.stopPropagation()}
    // Block the button's default mousedown behavior (focus + space-key
    // activation) without stopping propagation: react-grid-layout still
    // sees the event on the grid item and starts a drag, but the button
    // doesn't steal focus or arm a keyboard click that could fire
    // mid-gesture and interfere with the pointer drag in some browsers.
    onMouseDown={(e) => e.preventDefault()}
  >
    <DotsSixVerticalIcon size={16} weight="bold" />
  </button>
);

export { DragPill };
