import Link from "next/link";

const variants = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-secondary",
  gold: "btn-gold",
  light: "btn-on-dark",
} as const;

type Props = {
  href?: string;
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
};

export function Button({ href, children, variant = "primary", className = "", type = "button", onClick, disabled }: Props) {
  const cls = `${variants[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
