import { useToast } from './Toast';

export default function CopyOnClick({ content, children }: { content: string; children: React.ReactNode }) {
  const { addToast } = useToast();

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(content);
      addToast('Copied to clipboard');
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <button onClick={handleCopy} className="cursor-pointer">
      {children}
    </button>
  );
}
