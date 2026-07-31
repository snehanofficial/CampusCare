import React, { useState } from "react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { Tag } from "../../../components/ui/tag.js";
import type { ColumnDef } from "@tanstack/react-table";
import { BookOpen, ThumbsUp, Eye, Plus } from "lucide-react";
import { toast } from "sonner";

interface MockKbArticle {
  id: string;
  title: string;
  category: string;
  views: number;
  likes: number;
  updatedAt: string;
  summary: string;
}

const mockArticles: MockKbArticle[] = [
  {
    id: "kb-1",
    title: "How to connect to Campus-Secure Wi-Fi",
    category: "Networking",
    views: 1204,
    likes: 89,
    updatedAt: "2026-07-20",
    summary: "Step-by-step guidance to authenticate on macOS, Windows, Android, and iOS systems.",
  },
  {
    id: "kb-2",
    title: "Matlab license activation guide",
    category: "Software",
    views: 450,
    likes: 24,
    updatedAt: "2026-07-28",
    summary: "Instructions on obtaining the academic key and resetting your local software registry.",
  },
  {
    id: "kb-3",
    title: "LMS Canvas student integration setup",
    category: "Accounts",
    views: 890,
    likes: 67,
    updatedAt: "2026-07-15",
    summary: "Sync your student SIS enrollment roster to Canvas platform dynamically.",
  },
];

export function KnowledgeBasePage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    category: "",
  });

  const filtered = mockArticles.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(search.toLowerCase()) ||
      art.summary.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !filters.category || art.category === filters.category;
    return matchesSearch && matchesCategory;
  });

  const columns: ColumnDef<MockKbArticle>[] = [
    {
      accessorKey: "title",
      header: "Article Title",
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-bold text-foreground truncate">{row.getValue("title")}</p>
          <p className="text-[10px] text-muted-foreground truncate">{row.original.summary}</p>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <Tag variant="secondary">{row.getValue("category")}</Tag>,
    },
    {
      accessorKey: "views",
      header: "Views",
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
          <Eye className="size-3" />
          {row.getValue("views")}
        </span>
      ),
    },
    {
      accessorKey: "likes",
      header: "Helpful",
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
          <ThumbsUp className="size-3 text-success" />
          {row.getValue("likes")}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "Last Updated",
      cell: ({ row }) => (
        <span className="text-[11px] text-muted-foreground font-semibold">
          {row.getValue("updatedAt")}
        </span>
      ),
    },
  ];

  return (
    <EntityListTemplate
      title="Knowledge Base"
      description="Troubleshooting documentation and campus IT procedures catalog."
      columns={columns}
      data={filtered}
      loading={false}
      error={null}
      searchQuery={search}
      onSearchChange={setSearch}
      filterOptions={[
        {
          key: "category",
          label: "Category",
          options: [
            { value: "Networking", label: "Networking" },
            { value: "Software", label: "Software" },
            { value: "Accounts", label: "Accounts" },
          ],
        },
      ]}
      activeFilters={filters}
      onFilterChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
      onClearFilters={() => {
        setSearch("");
        setFilters({ category: "" });
      }}
      actions={[
        {
          label: "Create Article",
          onClick: () => toast.info("Article creation requires authoring privileges."),
          icon: Plus,
        },
      ]}
      pageIndex={1}
      pageCount={1}
      onPageChange={() => {}}
    />
  );
}
export default KnowledgeBasePage;
