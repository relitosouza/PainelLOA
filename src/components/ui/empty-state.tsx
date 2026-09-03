import React from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: string;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "search_off",
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 my-4 rounded-2xl border border-dashed border-outline-variant/80 bg-surface-container-lowest animate-in fade-in zoom-in-95">
      <div className="w-12 h-12 rounded-2xl bg-surface-container-high/80 text-primary flex items-center justify-center mb-3">
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <h3 className="text-sm font-bold text-on-surface mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-on-surface-variant max-w-md mb-4">{description}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-colors cursor-pointer"
        >
          {action.icon && (
            <span className="material-symbols-outlined text-sm">{action.icon}</span>
          )}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};
