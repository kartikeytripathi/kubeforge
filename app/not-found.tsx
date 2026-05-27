import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4 text-center">
      <div className="font-mono text-[#F5C842] text-8xl font-bold mb-4">404</div>
      <h1 className="text-[#E8E8E8] text-2xl font-mono mb-2">Page not found</h1>
      <p className="text-[#9CA3AF] font-mono mb-8 max-w-md">
        This lab or page doesn&apos;t exist. Check the URL or head back to the curriculum.
      </p>
      <Link
        href="/curriculum"
        className="font-mono text-sm bg-[#F5C842] text-[#0A0A0A] px-6 py-3 rounded-lg font-bold hover:bg-amber-400 transition-colors"
      >
        Back to Curriculum
      </Link>
    </div>
  );
}
