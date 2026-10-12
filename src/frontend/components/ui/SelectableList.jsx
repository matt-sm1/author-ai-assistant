export default function SelectableList({
  items = [],
  selectedItems = [],
  onSelect,
  onRemove,
  multiple = false,
  isLoading = false,
  error = null,
  emptyMessage = "No items available.",
  maxHeight = "max-h-40",
}) {
  const isSelected = (item) =>
    selectedItems.some((selected) => String(selected.id) === String(item.id));

  if (isLoading) {
    return (
      <p className="px-3 py-2 text-sm text-muted-foreground">Loading...</p>
    );
  }

  if (error) {
    return <p className="px-3 py-2 text-sm text-destructive">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <p className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    <div
      className={`${maxHeight} space-y-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]`}
    >
      {items.map((item) => {
        const selected = isSelected(item);

        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              if (multiple && selected) {
                onRemove?.(item.id);
              } else {
                onSelect?.(item);
              }
            }}
            className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
              selected
                ? "bg-accent font-medium text-accent-foreground"
                : "hover:bg-accent/50"
            }`}
          >
            <span>{item.name}</span>

            {selected && <span className="text-xs">Selected</span>}
          </button>
        );
      })}
    </div>
  );
}
