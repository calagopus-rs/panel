import { ReactNode, useEffect } from 'react';

export default function ContentContainer({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return children;
}
