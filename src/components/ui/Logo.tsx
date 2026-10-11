const logoSrc = "/logo.png";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const h = { sm: 64, md: 90, lg: 130 }[size];
  return (
    <img
      src={logoSrc}
      alt="Sithguy Hobbyshop"
      style={{
        height: h,
        width: "auto",
        display: "block",
        objectFit: "contain",
      }}
    />
  );
}

