import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Tag,
  Image,
  Users,
} from "lucide-react";

export const adminNavigation = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/post", label: "Posts", icon: FileText },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/tags", label: "Tags", icon: Tag },
  { href: "/admin/authors", label: "Authors", icon: Users },
  { href: "/admin/media", label: "Media Library", icon: Image },
];