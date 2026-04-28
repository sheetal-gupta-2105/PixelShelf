import { cn } from "@/lib/utils";
import { MediaItem } from "@/store/cozyStore";

interface Props {
  /** Custom uploaded image URL */
  coverImage?: string;
  /** "image" | "collage" | "gradient" — defaults to image if coverImage exists, else gradient */
  mode?: "image" | "collage" | "gradient";
  /** Fallback gradient class (used when no image / collage) */
  gradientClass: string;
  /** Items used to build a 2x2 collage when mode === "collage" */
  items?: MediaItem[];
  className?: string;
}

/**
 * Layered background for a collection card / banner:
 * Cover image (or collage / gradient) → dark overlay → soft gradient → pixel scanlines.
 */
export function CollectionCover({ coverImage, mode, gradientClass, items = [], className }: Props) {
  const resolvedMode: "image" | "collage" | "gradient" =
    mode ?? (coverImage ? "image" : "gradient");

  const collageItems = items.filter((i) => i.poster).slice(0, 4);
  const useCollage = resolvedMode === "collage" && collageItems.length >= 2;
  const useImage = resolvedMode === "image" && !!coverImage;

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {/* Base layer */}
      {useImage && (
        <img
          src={coverImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      )}

      {useCollage && (
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {collageItems.map((it, i) => (
            <div
              key={it.id + i}
              className="relative overflow-hidden"
              style={{
                backgroundImage: `url(${it.poster})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          ))}
          {/* fill empty quadrants if fewer than 4 */}
          {Array.from({ length: Math.max(0, 4 - collageItems.length) }).map((_, i) => (
            <div key={`empty-${i}`} className={cn("relative", gradientClass)} />
          ))}
        </div>
      )}

      {!useImage && !useCollage && <div className={cn("absolute inset-0", gradientClass)} />}

      {/* Dark overlay for legibility (stronger when using a real image) */}
      <div
        className={cn(
          "absolute inset-0",
          useImage || useCollage ? "bg-background/55" : "bg-background/0"
        )}
      />

      {/* Soft bottom gradient — keeps title readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent" />

      {/* Subtle pixel scanlines */}
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,0.18) 2px 3px)",
        }}
      />
    </div>
  );
}
