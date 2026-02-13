import type { ReactNode } from "react";

type IconBaseProps = {
  children: ReactNode;
  size?: number;
  color?: string;
  accent?: string;
  className?: string;
};

function IconBase({
  children,
  size = 18,
  color = "currentColor",
  className,
}: IconBaseProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconNewPaper({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" stroke="var(--accent)" />
      <line x1="9" y1="15" x2="15" y2="15" stroke="var(--accent)" />
    </IconBase>
  );
}

export function IconImport({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <path d="M4 15a7 7 0 1 1 11.7-6.8h1.8A4.5 4.5 0 0 1 20 16.4" />
      <line x1="12" y1="11.5" x2="12" y2="21" stroke="var(--accent)" />
      <path d="m8.5 17 3.5 4 3.5-4" stroke="var(--accent)" />
    </IconBase>
  );
}

export function IconScholar({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <path d="M2 9.8 12 5l10 4.8-10 4.8z" />
      <path d="M6.2 11.9v4.5c2.8 2.6 8.8 2.6 11.6 0V12" />
      <path d="M22 10v5.5" />
    </IconBase>
  );
}

export function IconIntegrity({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <path d="M12 22s8-3.8 8-9.8V5.5L12 2 4 5.5v6.7C4 18.2 12 22 12 22Z" />
      <path d="m9 12.5 2 2 4-4" stroke="var(--accent)" />
    </IconBase>
  );
}

export function IconSearch({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <circle cx="11" cy="11" r="6.5" />
      <line x1="16.2" y1="16.2" x2="21" y2="21" />
    </IconBase>
  );
}

export function IconReplace({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <path d="M8 7H19l-2.5-2.5" />
      <path d="M16.5 9.5 19 7" />
      <path d="M16 17H5l2.5 2.5" />
      <path d="M7.5 14.5 5 17" />
    </IconBase>
  );
}

export function IconSave({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <path d="M4 4h13l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M8 4v5h7V4" />
      <rect x="8" y="14" width="8" height="6" rx="1" />
    </IconBase>
  );
}

export function IconShare({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <circle cx="18" cy="5.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="18.5" r="2.5" />
      <path d="m8.3 11 7.4-4.2" />
      <path d="m8.3 13 7.4 4.2" />
    </IconBase>
  );
}

export function IconView({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.8" />
    </IconBase>
  );
}

export function IconEdit({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m13.5 5.5 3 3" />
    </IconBase>
  );
}

export function IconExport({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <path d="M20 15.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3.5" />
      <line x1="12" y1="3" x2="12" y2="14" stroke="var(--accent)" />
      <path d="m7.5 9.5 4.5 4.5 4.5-4.5" stroke="var(--accent)" />
    </IconBase>
  );
}

export function IconHistory({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <path d="M3 12a9 9 0 1 0 2.5-6.3" />
      <path d="M3 4.5v4h4" />
      <path d="M12 7.5V12l3 2" />
    </IconBase>
  );
}

export function IconScore({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <path d="M12 3 2.8 8 12 13l9.2-5z" />
      <path d="M6 10v5.2c3.2 2.2 8.8 2.2 12 0V10" />
    </IconBase>
  );
}

export function IconMobile({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <rect x="7.5" y="2.5" width="9" height="19" rx="1.8" />
      <line x1="10.5" y1="5.5" x2="13.5" y2="5.5" />
      <circle cx="12" cy="18.5" r="0.8" />
    </IconBase>
  );
}

export function IconSun({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" />
    </IconBase>
  );
}

export function IconMoon({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5Z" />
    </IconBase>
  );
}

export function IconLightbulb({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <path d="M8 14c-1.2-1-2-2.4-2-4a6 6 0 1 1 12 0c0 1.6-.8 3-2 4l-1 1.5H9L8 14Z" />
      <path d="M9.4 18h5.2M10 20h4" />
    </IconBase>
  );
}

export function IconResume({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <path d="M8 7 3 12l5 5" />
      <path d="M4 12h9a6 6 0 1 1 0 12" />
    </IconBase>
  );
}

export function IconDraft({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
      <path d="m16 15.5 3.5 3.5" stroke="var(--accent)" />
    </IconBase>
  );
}

export function IconContents({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <path d="M5 6h14M5 12h14M5 18h14" />
      <circle cx="3.5" cy="6" r="0.4" />
      <circle cx="3.5" cy="12" r="0.4" />
      <circle cx="3.5" cy="18" r="0.4" />
    </IconBase>
  );
}

export function IconDebug({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <path d="M10 3h4" />
      <rect x="7" y="6" width="10" height="12" rx="2" />
      <path d="M10 10h4M10 14h4" />
      <circle cx="12" cy="19.5" r="0.7" />
    </IconBase>
  );
}

export function IconRegex({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <path d="M8 8H6v8h2" strokeOpacity="0.6" />
      <path d="M16 8h2v8h-2" strokeOpacity="0.6" />
      <circle cx="12" cy="12" r="1.5" fill="var(--accent)" stroke="none" />
      <path d="M10 12h.01M14 12h.01" />
    </IconBase>
  );
}

export function IconAccessCode({
  size,
  color,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <IconBase size={size} color={color}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path
        d="M7 10h.01M12 10h.01M17 10h.01M7 14h.01M12 14h.01M17 14h.01"
        stroke="var(--accent)"
      />
    </IconBase>
  );
}

export function IconEmailInvite({
  size,
  color,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <IconBase size={size} color={color}>
      <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h9" />
      <path
        d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"
        stroke="var(--accent)"
      />
      <path d="M18 16l3 3-3 3M22 19h-4" />
    </IconBase>
  );
}

export function IconCopyLink({ size, color }: { size?: number; color?: string }) {
  return (
    <IconBase size={size} color={color}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        strokeOpacity="0.6"
      />
    </IconBase>
  );
}
