export default function SiteBadge({
  children = "Articles",
  className = "",
  ...props
}) {
  return (
    <span
      data-badge="true"
      className={`inline-flex rounded-[160px] bg-gradient-to-r from-[var(--theme-pink-pale)] via-[var(--theme-purple-pale)] to-[var(--theme-purple-light)] p-px ${className}`}
      {...props}
    >
      <span className="inline-flex items-center rounded-[160px] bg-white px-3 py-1 font-sans text-[12px] font-normal uppercase leading-[18px] tracking-normal text-copy sm:px-[14px] sm:py-[5px] sm:text-[14px] sm:leading-[21.7px]">
        {children}
      </span>
    </span>
  );
}
