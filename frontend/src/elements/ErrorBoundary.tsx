import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ReactNode } from 'react';
import { Component } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  override state: State = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: Error) {
    console.error(error);
  }

  override render() {
    return this.state.hasError ? (
      <div className='flex items-center justify-center w-full my-4'>
        <div className='flex items-center bg-neutral-900 rounded p-3 text-red-500'>
          <FontAwesomeIcon icon={faExclamationTriangle} className='h-4 w-auto mr-2' />

          <p className='text-sm text-neutral-100'>
            An error was encountered by the application while rendering this view. Try refreshing the page.
          </p>
        </div>
      </div>
    ) : (
      this.props.children
    );
  }
}

export default ErrorBoundary;
