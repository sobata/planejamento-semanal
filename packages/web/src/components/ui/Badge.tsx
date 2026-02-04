interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: 'solid' | 'outline';
  size?: 'sm' | 'md';
  onRemove?: () => void;
}

export function Badge({
  children,
  color = '#6366f1',
  variant = 'solid',
  size = 'md',
  onRemove,
}: BadgeProps) {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
  };

  const style =
    variant === 'solid'
      ? { backgroundColor: color, color: '#fff' }
      : { borderColor: color, color, borderWidth: '1px' };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-medium ${sizeClasses[size]}`}
      style={style}
    >
      {children}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:opacity-70"
        >
          ×
        </button>
      )}
    </span>
  );
}
