import AvaliadorHeader from "./AvaliadorHeader";

export default function AvaliadorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <AvaliadorHeader />
      {children}
    </div>
  );
}
