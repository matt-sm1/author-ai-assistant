import SiteBadge from "@/frontend/feature/blog/components/SiteBadge";

export default function BlogSectionInfo({
  badge = "Articles",
  heading = "Latest Insights for Modern Authors",
  description = "Explore practical ideas on AI, reader engagement, book marketing, and smarter ways to turn more visitors into loyal readers.",
  headingClassName = "max-w-[900px]",
  descriptionClassName = "",
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center gap-5 text-center ${className}`}>
      <SiteBadge>{badge}</SiteBadge>

      <h2
        className={`mx-auto text-center font-display text-[26px] font-bold leading-8 text-heading sm:text-4xl sm:leading-[46px] md:text-[56px] md:leading-[70px] ${headingClassName}`}
      >
        {heading}
      </h2>

      <p
        className={`mx-auto w-full max-w-[600px] text-center font-sans text-[14px] font-normal leading-[1.55] tracking-normal text-copy sm:text-[16px] sm:leading-[1.6] ${descriptionClassName}`}
      >
        {description}
      </p>
    </div>
  );
}
