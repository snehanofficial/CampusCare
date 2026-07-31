import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export function PageHeader({ title, description, actions, badge }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border mb-4">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-extrabold tracking-tight text-foreground sm:text-lg">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground leading-normal">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
export default PageHeader;
