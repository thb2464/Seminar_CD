import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Oops, something went wrong.</h2>
          <p>We're working on fixing the issue. Please try refreshing the page.</p>
          {this.props.fallback && <div>{this.props.fallback}</div>}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
