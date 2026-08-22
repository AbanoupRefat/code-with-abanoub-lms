"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
  label?: string;
  loadingLabel?: string;
  className?: string;
  variant?: "primary" | "destructive" | "outline";
  icon?: React.ReactNode;
  formAction?: string | ((formData: FormData) => void | Promise<void>);
}

export default function SubmitButton({ 
  label = "Submit", 
  loadingLabel = "Saving...", 
  className = "",
  variant = "primary",
  icon,
  formAction
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  let baseStyle = "px-4 py-2 rounded-md font-medium transition-opacity flex items-center justify-center gap-2 ";
  
  if (variant === "primary") {
    baseStyle += "bg-primary text-primary-foreground hover:opacity-90";
  } else if (variant === "destructive") {
    baseStyle += "bg-red-600 text-white hover:opacity-90";
  } else if (variant === "outline") {
    baseStyle += "border border-primary text-primary hover:bg-primary hover:text-primary-foreground";
  }

  return (
    <button 
      type="submit" 
      disabled={pending} 
      className={`${baseStyle} ${pending ? "opacity-70 cursor-not-allowed" : ""} ${className}`}
      formAction={formAction as any}
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {!pending && icon}
      {pending ? loadingLabel : label}
    </button>
  );
}
