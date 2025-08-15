import classNames from 'classnames';

export default ({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) => {
  return (
    <div className={classNames('bg-gray-700/50 rounded-md p-4 h-fit', className)}>
      <h1 className={'text-4xl font-bold text-white'}>{title}</h1>

      {children}
    </div>
  );
};
