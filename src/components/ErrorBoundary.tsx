import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-50 text-red-900 border border-red-200 m-10 rounded-xl">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <pre className="text-sm overflow-auto">{this.state.error?.toString()}</pre>
          <pre className="text-xs overflow-auto mt-4 text-red-700">{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children; 
  }
}
