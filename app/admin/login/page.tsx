import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Ops — sign in" };

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
