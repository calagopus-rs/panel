export default ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div className={'bg-gray-700/50 rounded-md p-4 h-fit'}>
      <h1 className={'text-4xl font-bold text-white'}>{title}</h1>

      {children}
    </div>
  );
};
