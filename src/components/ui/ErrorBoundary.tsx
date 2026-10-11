"use client";

import React, { Component, ReactNode, ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
  }

  public reset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-6 text-rose-950 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-100">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-rose-100 p-2 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold">Something went wrong</h3>
              <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">
                {this.state.error?.message || "An unexpected error occurred in this section."}
              </p>
              <button
                type="button"
                onClick={this.reset}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
