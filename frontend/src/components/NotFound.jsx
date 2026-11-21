import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div className="max-w-md">
        <p className="text-7xl font-bold text-[#dbe5ff]">404</p>
        <h1 className="mt-2 text-2xl font-bold text-[#1b2430]">Page not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#6b7685]">The page you requested does not exist or may have been moved.</p>
        <Link to="/" className="mt-5 inline-flex rounded-lg bg-[#2f5bea] px-4 py-2.5 text-sm font-semibold text-white shadow-sm">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
