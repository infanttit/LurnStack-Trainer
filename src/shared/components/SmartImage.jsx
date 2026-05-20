import { useMemo, useState } from "react";

export default function SmartImage({
  src,
  alt = "",
  className = "",
  fallbackClassName = "",
  fallback,
  loading = "lazy",
  decoding = "async",
}) {
  const [failed, setFailed] = useState(false);
  const safeSrc = useMemo(() => String(src || "").trim(), [src]);

  if (!safeSrc || failed) {
    if (fallback) return fallback;
    return <div className={fallbackClassName} aria-hidden="true" />;
  }

  return (
    <img
      src={safeSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      onError={() => setFailed(true)}
    />
  );
}

