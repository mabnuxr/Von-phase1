import React from 'react';
import { WidgetLayout } from './WidgetLayout';
import { ChartWidget } from '../ChartWidget';
import { TableWidget } from '../TableWidget';
import type { WidgetProps } from './types';
import type { ChartConfig, MetricConfig, TextConfig } from '../types';
import { TrendUp, TrendDown, Minus } from '@phosphor-icons/react';

const getWidgetTitle = (widget: WidgetProps['widget']): string => {
  if (widget.type === 'chart') {
    return (widget.config as ChartConfig).title || widget.title;
  }
  if (widget.type === 'metric') {
    return (widget.config as MetricConfig).label || widget.title;
  }
  return widget.title;
};

const getWidgetSubtitle = (widget: WidgetProps['widget']): string | undefined => {
  if (widget.type === 'chart') {
    return (widget.config as ChartConfig).subtitle;
  }
  return undefined;
};

const MetricContent: React.FC<{ config: MetricConfig }> = ({ config }) => {
  const formatValue = (value: string | number, format?: string): string => {
    if (typeof value === 'string') return value;

    switch (format) {
      case 'currency':
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value}%`;
      default:
        return value.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    if (!config.change) return null;

    switch (config.changeType) {
      case 'positive':
        return <TrendUp size={16} weight="bold" className="text-green-500" />;
      case 'negative':
        return <TrendDown size={16} weight="bold" className="text-red-500" />;
      default:
        return <Minus size={16} weight="bold" className="text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (config.changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="p-4 flex flex-col justify-center h-full">
      <div className="text-3xl font-bold text-gray-900">
        {formatValue(config.value, config.format)}
      </div>
      {config.change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-sm ${getTrendColor()}`}>
          {getTrendIcon()}
          <span>
            {config.change > 0 ? '+' : ''}
            {config.change}%
          </span>
        </div>
      )}
    </div>
  );
};

const TextContent: React.FC<{ config: TextConfig }> = ({ config }) => {
  const getTextClass = () => {
    switch (config.variant) {
      case 'heading':
        return 'text-xl font-bold text-gray-900';
      case 'subheading':
        return 'text-lg font-semibold text-gray-800';
      case 'caption':
        return 'text-xs text-gray-500';
      default:
        return 'text-sm text-gray-700';
    }
  };

  return (
    <div className="p-4">
      <p className={getTextClass()}>{config.content}</p>
    </div>
  );
};

const Widget: React.FC<WidgetProps> = ({ widget, onEdit, onExpand, onDelete }) => {
  const title = getWidgetTitle(widget);
  const subtitle = getWidgetSubtitle(widget);

  const renderContent = () => {
    switch (widget.type) {
      case 'chart':
        return <ChartWidget widget={widget} hideHeader />;
      case 'table':
        return <TableWidget widget={widget} hideHeader />;
      case 'metric':
        return <MetricContent config={widget.config as MetricConfig} />;
      case 'text':
        return <TextContent config={widget.config as TextConfig} />;
      default:
        return <div className="p-4 text-gray-500">Unknown widget type</div>;
    }
  };

  return (
    <WidgetLayout
      title={title}
      subtitle={subtitle}
      onEdit={onEdit}
      onExpand={onExpand}
      onDelete={onDelete}
    >
      {renderContent()}
    </WidgetLayout>
  );
};

export { Widget };
