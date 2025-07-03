import minecraftBackground from '@/assets/minecraft_background.png';

export default ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div className="flex h-screen">
      <div className="w-1/2 h-full">
        <img src={minecraftBackground} alt="Minecraft Background" className="w-full h-full object-cover" />
      </div>
      <div className="w-1/2 h-full">
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-3xl font-bold text-white mb-4">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
};
