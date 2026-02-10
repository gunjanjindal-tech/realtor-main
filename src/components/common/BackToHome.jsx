"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackToHome() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/")}
      className="flex items-center gap-2 text-sm text-black hover:text-[#091D35] mb-6"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Home
    </button>
  );
}
