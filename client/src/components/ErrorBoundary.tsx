import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
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
    console.error('[LeafPulse ErrorBoundary caught an unhandled error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F5F1E6] text-[#3B2F2A]">
          <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-[#C9D8C5] shadow-lifted text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#FBECE6] text-[#C8693F] flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-[#C8693F]" />
            </div>

            <div className="space-y-2">
              <h1 className="font-serif font-bold text-2xl text-[#1F3D2B]">
                Something went wrong
              </h1>
              <p className="text-xs sm:text-sm text-[#736159] leading-relaxed">
                An unexpected interface issue occurred. Your botanical care records remain safely preserved.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="primary"
                onClick={this.handleReset}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
