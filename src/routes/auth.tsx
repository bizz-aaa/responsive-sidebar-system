import { createFileRoute } from "@tanstack/react-router";
import { AccountForm } from "@/components/AccountForm";
import { pageHead } from "@/lib/registration";
export const Route = createFileRoute("/auth")({ head: () => pageHead("Sign in", "Sign in to TUCASA Nyerere Campus with your phone number and password."), component: () => <AccountForm /> });