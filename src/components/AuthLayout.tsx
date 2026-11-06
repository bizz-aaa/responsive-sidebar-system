import type { ReactNode } from "react";
import { BrandLogos } from "./BrandLogos";

export function AuthLayout({ children, title }: { children: ReactNode; title: string; subtitle?: string }) {
  return <main className="flex min-h-svh items-center justify-center bg-ocean-gradient px-5 py-10 text-on-ocean">
    <section className="w-full max-w-md">
      <div className="mb-8 flex justify-center"><BrandLogos large /></div>
      <h1 className="mb-7 text-center text-2xl font-bold">{title}</h1>
      {children}
    </section>
  </main>;
}