import { createFileRoute } from "@tanstack/react-router";
import { AccountForm } from "@/components/AccountForm";
import { pageHead } from "@/lib/registration";
export const Route = createFileRoute("/auth")({ head: () => pageHead("Ingia", "Ingia TUCASA Nyerere Campus kwa simu na password."), component: () => <AccountForm /> });