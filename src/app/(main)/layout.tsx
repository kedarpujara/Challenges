import { BottomNav } from '@/components/navigation/BottomNav';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-20 safe-area-top">
      <main className="max-w-lg mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
