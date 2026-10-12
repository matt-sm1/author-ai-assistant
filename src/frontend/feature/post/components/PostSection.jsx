import { Panel } from "@/frontend/components/shared/ui-bits";

export default function PostSection({ title, children }) {
  return (
    <Panel className="p-5">
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </Panel>
  );
}