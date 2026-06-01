import { useEffect, useRef } from "react";
import { useGuide } from "@knocklabs/react";
import { X } from "@phosphor-icons/react";

/**
 * The key of the Knock in-app guide we render as a one-time launch modal.
 * Configured entirely in the Knock dashboard (audience, activation, schedule).
 */
const LAUNCH_GUIDE_KEY = "von-marketing-launch-june-2026-guide";

/**
 * Content shape for the `carousel-modal` custom message type, verified against
 * the live guide JSON payload (schema_key "carousel-modal", variant "default"):
 *   banner_image: { url, alt, action }  // PNG banner
 *   subtitle:     string                // rich text / HTML
 *   cta_button:   { text, action }
 * `image` is kept as a defensive fallback (the sibling plain "modal" message
 * type uses `image` instead), and video URLs are handled in case the banner is
 * ever swapped for a video.
 */
type Media = { url?: string; alt?: string; action?: string };

type LaunchContent = {
  banner_image?: Media;
  image?: Media;
  title?: string;
  subtitle?: string; // rich text / HTML
  cta_button?: { text?: string; action?: string };
};

const isVideoUrl = (url: string) =>
  /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url);

// Knock serves banner assets from our public S3 bucket. In dev we route them
// through the same-origin `/s3-assets` proxy (see vite.config.ts) so the image
// isn't fetched cross-origin from the browser. We match the bucket with an
// (escaped) regex ON PURPOSE: a plain string literal of the bucket URL would
// itself be rewritten to "/s3-assets" by the build-time s3ProxyPlugin, which
// would break this runtime replace. In prod the URL is used as-is (the proxy
// only exists on the dev server).
const S3_PUBLIC_BUCKET =
  /^https:\/\/vonlabs-public-assets\.s3\.[a-z0-9-]+\.amazonaws\.com/;
const toAssetUrl = (url: string) =>
  import.meta.env.DEV ? url.replace(S3_PUBLIC_BUCKET, "/s3-assets") : url;

/**
 * One-time launch modal rendered headlessly from a Knock guide.
 *
 * Show-once is enforced by archiving at Knock (server-side, keyed by user id) —
 * NOT via localStorage. Once dismissed or acted upon, Knock stops serving the
 * guide to that user, so it never reappears on reload.
 */
export function LaunchModal() {
  const { step } = useGuide<LaunchContent>({ key: LAUNCH_GUIDE_KEY });
  const seenRef = useRef<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Analytics only — does NOT prevent re-display. Mark once per distinct step.
  useEffect(() => {
    if (!step) return;
    if (seenRef.current === step.ref) return;
    if (!step.message.seen_at) {
      // Fire-and-forget analytics: swallow rejections so a transient failure
      // doesn't surface as an unhandled rejection (we never retry it).
      void step.markAsSeen().catch(() => {});
    }
    seenRef.current = step.ref;
  }, [step]);

  // Move focus into the dialog on open and allow Escape to dismiss (Escape
  // archives, same as any other dismissal, to preserve show-once semantics).
  useEffect(() => {
    if (!step) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        void step
          .markAsArchived()
          .catch((err) =>
            console.error("[LaunchModal] Failed to archive guide", err),
          );
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [step]);

  if (!step) return null;

  const { banner_image, image, title, subtitle, cta_button } = step.content;
  const banner = banner_image ?? image;

  // Archiving is what enforces show-once. A failed archive means the guide will
  // reappear on the next load, so log it rather than swallowing silently.
  const archive = () =>
    step
      .markAsArchived()
      .catch((err) =>
        console.error("[LaunchModal] Failed to archive guide", err),
      );

  const dismiss = () => void archive();

  const handleCtaClick = () => {
    void step.markAsInteracted().catch(() => {});
    void archive();
    if (cta_button?.action) {
      window.open(cta_button.action, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 antialiased"
      onClick={dismiss}
      role="presentation"
    >
      <div
        className="relative flex w-full max-w-[480px] flex-col overflow-hidden rounded-xl bg-white shadow-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "launch-modal-title" : undefined}
        aria-label={title ? undefined : "Product announcement"}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-600 transition-colors hover:bg-white hover:text-gray-900"
        >
          <X size={18} weight="bold" />
        </button>

        {banner?.url &&
          (isVideoUrl(banner.url) ? (
            <video
              src={toAssetUrl(banner.url)}
              className="block w-full"
              autoPlay
              muted
              loop
              playsInline
              controls
            />
          ) : (
            <img
              src={toAssetUrl(banner.url)}
              alt={banner.alt ?? ""}
              className="block w-full"
            />
          ))}

        <div className="flex flex-col items-center gap-4 p-6 text-center">
          {title && (
            <h2
              id="launch-modal-title"
              className="m-0 text-xl font-semibold text-gray-900"
            >
              {title}
            </h2>
          )}

          {subtitle && (
            // subtitle is trusted, internally-authored rich text (e.g. <br/>).
            // Render as HTML so tags don't show literally. Add sanitization
            // only if this could ever contain user-supplied input.
            <div
              className="text-sm leading-6 text-gray-700"
              dangerouslySetInnerHTML={{ __html: subtitle }}
            />
          )}

          {cta_button?.action && (
            <button
              type="button"
              onClick={handleCtaClick}
              className="mt-1 rounded-full bg-[var(--color-von-purple-500)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-von-purple-600)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-von-purple-500)] focus-visible:ring-offset-2"
            >
              {cta_button.text ?? "Learn more"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default LaunchModal;
