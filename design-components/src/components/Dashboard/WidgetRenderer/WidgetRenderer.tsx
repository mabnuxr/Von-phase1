import { WidgetShell } from '../WidgetShell';
import { ChartWidget } from '../ChartWidget';
import { CounterWidget } from '../CounterWidget';
import { TextWidget } from '../TextWidget';
import { TableWidget } from '../TableWidget';
import type {
  WidgetRendererProps,
  ChartWidgetConfig,
  CounterWidgetConfig,
  TableWidgetConfig,
  TextWidgetConfig,
} from '../types';

/**
 * Routes a widget config to the correct atomic widget component,
 * wrapped in a WidgetShell for consistent card styling.
 *
 * Text widgets render without a shell since they ARE the header content.
 */
const WidgetRenderer: React.FC<WidgetRendererProps> = ({ widget }) => {
  switch (widget.type) {
    case 'chart':
      return (
        <WidgetShell title={widget.title} subtitle={widget.subtitle}>
          <ChartWidget config={widget.config as ChartWidgetConfig} />
        </WidgetShell>
      );

    case 'counter':
      return (
        <CounterWidget
          config={widget.config as CounterWidgetConfig}
          title={widget.title}
          subtitle={widget.subtitle}
        />
      );

    case 'text':
      return (
        <div className="h-full">
          <TextWidget config={widget.config as TextWidgetConfig} />
        </div>
      );

    case 'table':
      return (
        <WidgetShell title={widget.title} subtitle={widget.subtitle}>
          <TableWidget config={widget.config as TableWidgetConfig} />
        </WidgetShell>
      );

    default:
      return (
        <WidgetShell title={widget.title}>
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            Unknown widget type
          </div>
        </WidgetShell>
      );
  }
};

export { WidgetRenderer };
