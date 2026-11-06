import { createFileRoute } from "@tanstack/react-router";
import { AccountForm } from "@/components/AccountForm";
import { pageHead } from "@/lib/registration";
export const Route = createFileRoute("/sign-up")({ head: () => pageHead("Create account", "Create your TUCASA Nyerere Campus account."), component: () => <AccountForm signup /> });