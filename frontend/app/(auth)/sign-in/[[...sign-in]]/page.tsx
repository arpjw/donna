import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        elements: {
          rootBox: "w-full",
          card: "bg-card border border-border rounded-md shadow-none",
          headerTitle: "text-text-primary font-display text-2xl",
          headerSubtitle: "text-text-secondary font-sans text-sm",
          formFieldLabel: "text-text-secondary font-sans text-xs uppercase tracking-wider",
          formFieldInput:
            "bg-surface border-border text-text-primary font-sans placeholder:text-text-tertiary focus:border-crimson focus:ring-0",
          formButtonPrimary:
            "bg-crimson hover:bg-crimson/90 text-white font-sans text-sm font-medium",
          footerActionLink: "text-crimson hover:text-crimson/80",
          identityPreviewText: "text-text-primary",
          identityPreviewEditButton: "text-crimson",
        },
        variables: {
          colorBackground: "#161616",
          colorInputBackground: "#111111",
          colorInputText: "#F0EEE9",
          colorText: "#F0EEE9",
          colorTextSecondary: "#737373",
          colorPrimary: "#C0392B",
          colorDanger: "#C0392B",
          borderRadius: "4px",
          fontFamily: "var(--font-geist-sans)",
        },
      }}
    />
  );
}
