import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BrandLogos } from "./BrandLogos";

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return <main className="min-h-screen bg-ocean-gradient text-on-ocean">
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
      <Link to="/" className="text-lg font-bold">TUCASA <span className="font-normal text-on-ocean/70">TNC</span></Link>
      <span className="text-right text-xs text-on-ocean/70">University of Dar es Salaam</span>
    </header>
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-20 lg:py-16">
      <section className="space-y-6"><BrandLogos large /><div><p className="mb-3 text-xs font-semibold uppercase text-on-ocean/65">Faith · Fellowship · Service</p><h1 className="text-3xl font-bold leading-tight sm:text-4xl">TUCASA<br />Nyerere Campus</h1><p className="mt-4 max-w-sm text-sm leading-relaxed text-on-ocean/75">Tanzania Universities and Colleges Adventist Students Association</p></div><div className="h-px max-w-sm bg-glass-border" /><p className="text-sm text-on-ocean/65">Public Campus Ministries · UDSM</p></section>
      <section className="rounded-lg bg-card p-6 text-card-foreground shadow-xl sm:p-9"><h2 className="text-2xl font-bold">{title}</h2><p className="mb-7 mt-2 text-sm text-muted-foreground">{subtitle}</p>{children}</section>
    </div>
    <footer className="px-5 py-6 text-center text-xs text-on-ocean/60">TUCASA Nyerere Campus Management System</footer>
  </main>;
}