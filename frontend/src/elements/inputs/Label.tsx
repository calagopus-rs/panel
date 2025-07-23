export default ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => {
  return (
    <label htmlFor={htmlFor} className={'block mt-3 font-bold'}>
      {children}
    </label>
  );
};
