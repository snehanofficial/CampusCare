import { Link } from "react-router";
import { RegisterForm } from "../components/RegisterForm.js";

export function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Create account
        </h2>
        <p className="text-xs text-muted-foreground">
          Sign up for a student portal account to file support tickets
        </p>
      </div>

      <RegisterForm />

      <div className="text-center text-xs text-muted-foreground border-t border-border/40 pt-4">
        <span>Already have an account? </span>
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign in instead
        </Link>
      </div>
    </div>
  );
}
export default RegisterPage;
