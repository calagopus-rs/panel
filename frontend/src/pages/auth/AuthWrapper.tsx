import minecraftBackground from '@/assets/minecraft_background.webp';

export default ({ title, children }: { title?: string; children: React.ReactNode }) => {
  return (
    <div className={'flex items-center justify-center h-screen'}>
      <img
        src={minecraftBackground}
        alt={'Minecraft Background'}
        className={'hidden md:block w-1/2 h-full object-cover opacity-90'}
      />
      <div className={'md:w-1/2 h-full'}>
        <div className={'flex flex-col items-center justify-center h-full px-2 md:px-0'}>
          {title && <h1 className={'text-3xl font-bold text-white mb-4'}>{title}</h1>}
          {children}
        </div>
      </div>
    </div>
  );
};
