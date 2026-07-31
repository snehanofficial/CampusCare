import { Link } from "react-router";
import { LoginForm } from "../components/LoginForm.js";

export function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="text-xs text-muted-foreground">
          Enter your campus credentials to sign in to your dashboard
        </p>
      </div>

      <LoginForm />

      <div className="text-center text-xs text-muted-foreground border-t border-border/40 pt-4">
        <span>Need a student account? </span>
        <Link to="/register" className="font-semibold text-primary hover:underline">
          Sign up here
        </Link>
      </div>
    </div>
  );
}
export default LoginPage;
