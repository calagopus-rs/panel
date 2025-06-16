export default function Container({ children }: { children: React.ReactNode }) {
  return <div className="mt-12 px-12 container mx-auto">{children}</div>;
}
