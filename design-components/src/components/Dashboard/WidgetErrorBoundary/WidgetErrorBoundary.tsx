import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  widgetId: string;
  widgetTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary for individual dashboard widgets.
 * Catches rendering errors in a single widget without crashing the entire dashboard.
 */
class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[WidgetErrorBoundary] Widget "${this.props.widgetId}" failed to render:`,
      error,
      errorInfo
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <div className="text-red-600 font-medium mb-2">
              {this.props.widgetTitle || 'Widget'} failed to load
            </div>
            <div className="text-sm text-red-500">
              {this.state.error?.message || 'An unexpected error occurred'}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { WidgetErrorBoundary };