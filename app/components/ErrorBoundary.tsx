import { Component, type ReactNode } from "react";
import { Link } from "react-router";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-red-400">Something went wrong</p>
          <p className="text-gray-500 text-sm mt-2">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <Link to="/games" className="btn-neon-cyan mt-4 inline-block">
            Back to Games
          </Link>
        </div>
      );
    }

    return this.props.children;
  }
}
