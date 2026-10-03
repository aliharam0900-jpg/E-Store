"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Tags,
  Plus,
  Trash2,
  Edit,
  Loader2,
  FolderTree,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/services/categories";
import type { Category } from "@/types";

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);

  // Form state
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [parentId, setParentId] = React.useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setParentId(null);
    setEditingCategory(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || "");
    setParentId(category.parent_id);
    setDialogOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
    }
  };

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Category name is required");
      if (!slug.trim()) throw new Error("Category slug is required");

      if (editingCategory) {
        return await updateCategory(editingCategory.id, {
          name,
          slug,
          description: description || null,
          parent_id: parentId === "none" ? null : parentId,
        });
      } else {
        return await createCategory({
          name,
          slug,
          description: description || null,
          parent_id: parentId === "none" ? null : parentId,
        });
      }
    },
    onSuccess: (cat) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(
        editingCategory
          ? `Category "${cat.name}" updated`
          : `Category "${cat.name}" created`
      );
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save category");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete category");
    },
  });

  // Lookup map for parent names
  const categoryMap = React.useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Tags className="h-5 w-5" /> Category Hierarchy
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organize catalog products into hierarchical taxonomy classifications
          </p>
        </div>

        <Button onClick={openCreateDialog} size="sm" className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {/* Categories Table */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-foreground" />
            <span className="text-xs font-mono">LOADING_CATEGORIES...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <FolderTree className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">No categories defined</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Create category buckets to cluster products into clean navigable taxonomy trees.
            </p>
            <Button onClick={openCreateDialog} size="sm" variant="outline" className="text-xs mt-2">
              Create Category
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Category Name</TableHead>
                <TableHead>Slug Identifier</TableHead>
                <TableHead>Parent Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => {
                const parentName = cat.parent_id
                  ? categoryMap.get(cat.parent_id) || "Unknown"
                  : null;

                return (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium text-xs text-foreground">
                      {cat.name}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      /{cat.slug}
                    </TableCell>
                    <TableCell>
                      {parentName ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-muted border border-border text-foreground">
                          ↳ {parentName}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          [ROOT]
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {cat.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(cat)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Edit Category"
                          aria-label="Edit Category"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (
                              confirm(
                                `Delete category "${cat.name}"? Products assigned to it will become unassigned.`
                              )
                            ) {
                              deleteMutation.mutate(cat.id);
                            }
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Delete Category"
                          aria-label="Delete Category"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add / Edit Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Create New Category"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Category Name *</Label>
              <Input
                id="cat-name"
                placeholder="e.g. Luxury Timepieces"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-slug">URL Slug *</Label>
              <Input
                id="cat-slug"
                placeholder="luxury-timepieces"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-parent">Parent Category (Optional)</Label>
              <Select
                value={parentId || "none"}
                onValueChange={(val) => setParentId(val === "none" ? null : val)}
              >
                <SelectTrigger id="cat-parent" className="text-xs">
                  <SelectValue placeholder="Root level (No parent)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Root Category (No Parent)</SelectItem>
                  {categories
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Description (Optional)</Label>
              <Textarea
                id="cat-desc"
                rows={3}
                placeholder="Brief category context for storefront taxonomy..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="gap-2"
            >
              {saveMutation.isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              {editingCategory ? "Update Category" : "Save Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
