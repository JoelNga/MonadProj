import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">TruthVault</h1>
      <p className="text-gray-400 text-lg mb-8 text-center max-w-md">
        Decentralized evidence management system with time-based disclosure and ZK identity verification.
      </p>
      
      <div className="flex gap-4">
        <Link 
          href="/upload"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Upload Evidence
        </Link>
        <Link 
          href="/dashboard"
          className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}