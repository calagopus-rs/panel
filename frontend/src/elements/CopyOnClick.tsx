import classNames from 'classnames';
import { useToast } from '@/providers/ToastProvider';

export default function CopyOnClick({
  content,
  className,
  children,
}: {
  content: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { addToast } = useToast();

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!window.isSecureContext) {
      addToast('Copying is only available in secure contexts (HTTPS).', 'error');
      return;
    }

    navigator.clipboard
      .writeText(content)
      .then(() => {
        addToast('Copied to clipboard');
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <button onClick={handleCopy} className={classNames('cursor-pointer', className)}>
      {children}
    </button>
  );
}
