import Link from "next/link";
import { toNestedHostingerMediaUrl } from "@/frontend/lib/hostinger-media-url";

/**
 * Pixel-matched port of marketing ArticleCard.
 */
export default function ArticleCard({ title, date, href, image, imageAlt }) {
  const src =
    toNestedHostingerMediaUrl(image ?? "") || image || "";

  const className =
    "group flex w-full flex-col overflow-hidden rounded-xl bg-white p-1.5 shadow-[var(--shadow-card-sm)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-raised)]";

  const content = (
    <>
      <div className="relative aspect-[1.45] w-full overflow-hidden rounded-lg bg-[linear-gradient(135deg,var(--theme-pink-pale),var(--theme-purple-pale),var(--theme-purple-light))] sm:aspect-[1.5] lg:aspect-[1.6]">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- Hostinger CDN URLs; matches MediaImage approach
          <img
            src={src}
            alt={imageAlt || title || ""}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>

      <div className="flex min-h-[150px] flex-col px-4 pb-4 pt-5 sm:min-h-[154px] sm:px-5 sm:pb-5 sm:pt-6 lg:min-h-[158px] lg:pl-[23.2px] lg:pr-5">
        {date ? (
          <time className="font-sans text-[13px] font-normal leading-[20px] tracking-normal text-[var(--theme-copy)] sm:text-[14px] sm:leading-[21.7px]">
            {date}
          </time>
        ) : null}

        <h3 className="max-w-[357.04px] pt-2 font-display text-[20px] font-semibold leading-[25px] tracking-normal text-heading sm:text-[22px] sm:leading-[27px] lg:text-[24px] lg:leading-[28.8px]">
          {title}
        </h3>
      </div>
    </>
  );

  if (!href || href === "#") {
    return <article className={className}>{content}</article>;
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
