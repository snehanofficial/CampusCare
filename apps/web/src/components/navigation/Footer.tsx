export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card py-3 px-6 text-center text-xs text-muted-foreground flex items-center justify-between">
      <p>© {new Date().getFullYear()} CampusCare. All rights reserved.</p>
      <div className="flex items-center gap-4">
        <span>v1.0.0</span>
      </div>
    </footer>
  );
}
