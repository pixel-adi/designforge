import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
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
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const message = this.state.error?.message || "Unknown error";
      const isDev = import.meta.env.DEV;
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-black/5 p-8">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-semibold text-[#262626] mb-3">Something went wrong</h1>
            <p className="text-sm text-foreground/60 mb-4 leading-relaxed">
              We've encountered an unexpected error. Please try refreshing the page or returning home.
            </p>
            <div className="text-left text-xs bg-red-50 text-red-700 rounded-lg p-3 mb-6 overflow-auto max-h-48 whitespace-pre-wrap break-all font-mono">
              <p className="font-bold mb-1">{message}</p>
              {this.state.error?.stack && <p className="opacity-80 text-[10px] mt-1">{this.state.error.stack}</p>}
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <button 
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 h-11 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </button>
              <button 
                onClick={() => window.location.href = "/"}
                className="w-full flex items-center justify-center gap-2 h-11 bg-black/5 text-foreground rounded-xl font-semibold hover:bg-black/10 transition-colors"
              >
                <Home className="w-4 h-4" />
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
