import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { logger } from '../../config/env';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Use environment-aware logger
    logger.error('ErrorBoundary caught an error:', error, errorInfo);

    // Here you would typically log to an error reporting service
    // Example: logErrorToService(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#f5f5f7] font-sf">
          <div className="w-full max-w-[500px] bg-white rounded-xl p-8 shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-center">
            {/* Error Icon */}
            <div className="text-5xl mb-4">⚠️</div>

            {/* Error Title */}
            <h1 className="text-2xl font-semibold mb-3 text-[#1a1a1a]">Something went wrong</h1>

            {/* Error Message */}
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            {/* Development-only error details */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 mb-6 text-left cursor-pointer">
                <summary className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg overflow-auto text-xs text-red-900 max-h-60">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border-0 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-blue-700"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 text-sm font-medium text-blue-600 bg-transparent border border-blue-600 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-100"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
