import React, { Component, ErrorInfo } from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
            <h3 className="text-lg font-semibold text-destructive">
              Something went wrong
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              An error occurred while loading this section.
            </p>
            <button
              onClick={this.handleReset}
              className="mt-4 rounded-md bg-destructive px-3.5 py-2.5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90"
            >
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
