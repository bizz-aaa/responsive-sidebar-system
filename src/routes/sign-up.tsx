import { createFileRoute } from "@tanstack/react-router";
import { AccountForm } from "@/components/AccountForm";
import { pageHead } from "@/lib/registration";
export const Route = createFileRoute("/sign-up")({ head: () => pageHead("Jisajili", "Tengeneza akaunti ya TUCASA Nyerere Campus."), component: () => <AccountForm signup /> });