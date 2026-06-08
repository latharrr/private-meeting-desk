import ProfileSection from '@/components/profile-section';
import BookingCard from '@/components/booking-card';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <ProfileSection />
        <BookingCard />

        {/* Footer spacer */}
        <div className="py-12 md:py-16 text-center">
          <p className="text-[10px] text-[rgba(240,240,245,0.2)] tracking-widest uppercase">
            Private Meeting Desk
          </p>
        </div>
      </div>
    </main>
  );
}
