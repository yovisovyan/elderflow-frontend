"use client";

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <p className="text-xl text-gray-700">
        Welcome to ElderFlow – Please{" "}
        <a href="/login" className="text-blue-600 underline">
          log in
        </a>
      </p>
    </div>
  );
}
