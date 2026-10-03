"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UploadCloud,
  Trash2,
  Plus,
  Loader2,
  Image as ImageIcon,
  Check,
  ArrowLeft,
  Bold,
  Italic,
  List,
  Heading2,
  Code,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getCategories } from "@/lib/services/categories";
import {
  createProduct,
  updateProduct,
  type CreateProductInput,
} from "@/lib/services/products";
import { uploadProductImage, deleteProductImage } from "@/lib/supabase/storage";
import type { ProductWithDetails } from "@/types";

export const productVariantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  size: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  inventory_count: z.number().int().min(0, "Stock cannot be negative"),
  price_adjustment: z.number().default(0),
});

export const productImageSchema = z.object({
  image_url: z.string().url("Valid image URL required"),
  alt_text: z.string().optional().nullable(),
  display_order: z.number().int().default(0),
});

export const productFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase alphanumeric characters and hyphens"
    ),
  description: z.string().optional().nullable(),
  base_price: z.number().positive("Base price must be greater than $0.00"),
  compare_at_price: z
    .number()
    .min(0, "Compare price cannot be negative")
    .optional()
    .nullable(),
  category_id: z.string().optional().nullable(),
  is_published: z.boolean().default(false),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  variants: z
    .array(productVariantSchema)
    .min(1, "At least one variant/SKU is required"),
  images: z.array(productImageSchema).default([]),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  initialData?: ProductWithDetails | null;
  productId?: string;
}

export function ProductForm({ initialData, productId }: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = React.useState(false);

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const defaultValues: Partial<ProductFormValues> = {
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    base_price: initialData?.base_price || 0,
    compare_at_price: initialData?.compare_at_price ?? undefined,
    category_id: initialData?.category_id || undefined,
    is_published: initialData?.is_published ?? false,
    seo_title: initialData?.seo_title || "",
    seo_description: initialData?.seo_description || "",
    variants:
      initialData?.variants && initialData.variants.length > 0
        ? initialData.variants.map((v) => ({
            sku: v.sku,
            size: v.size || "",
            color: v.color || "",
            inventory_count: v.inventory_count,
            price_adjustment: v.price_adjustment,
          }))
        : [
            {
              sku: "",
              size: "",
              color: "",
              inventory_count: 10,
              price_adjustment: 0,
            },
          ],
    images:
      initialData?.images && initialData.images.length > 0
        ? initialData.images.map((img) => ({
            image_url: img.image_url,
            alt_text: img.alt_text || "",
            display_order: img.display_order,
          }))
        : [],
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: defaultValues as ProductFormValues,
    mode: "onChange",
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control: form.control,
    name: "images",
  });

  // Auto-slug generator from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const titleVal = e.target.value;
    form.setValue("title", titleVal);

    if (!initialData) {
      const generatedSlug = titleVal
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      form.setValue("slug", generatedSlug, { shouldValidate: true });

      // Pre-fill primary variant SKU if empty
      const currentVariants = form.getValues("variants");
      if (currentVariants.length === 1 && !currentVariants[0].sku && generatedSlug) {
        form.setValue("variants.0.sku", `${generatedSlug.toUpperCase().slice(0, 10)}-001`);
      }
    }
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const toastId = toast.loading("Uploading product media...");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadProductImage(file, productId);
        appendImage({
          image_url: res.url,
          alt_text: file.name.replace(/\.[^/.]+$/, ""),
          display_order: imageFields.length + i,
        });
      }
      toast.success("Images uploaded successfully", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload images", { id: toastId });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // Rich Text Editor formatting helper
  const insertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("product-description-editor") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const selected = current.substring(start, end);
    const replacement = `${prefix}${selected || "text"}${suffix}`;

    const updated = current.substring(0, start) + replacement + current.substring(end);
    form.setValue("description", updated, { shouldDirty: true });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 10);
  };

  // Mutation for Product Creation / Update
  const mutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const payload: CreateProductInput = {
        title: values.title,
        slug: values.slug,
        description: values.description,
        base_price: values.base_price,
        compare_at_price: values.compare_at_price,
        category_id: values.category_id || null,
        is_published: values.is_published,
        seo_title: values.seo_title,
        seo_description: values.seo_description,
        variants: values.variants.map((v) => ({
          sku: v.sku,
          size: v.size || null,
          color: v.color || null,
          inventory_count: v.inventory_count,
          price_adjustment: v.price_adjustment,
        })),
        images: values.images.map((img, idx) => ({
          image_url: img.image_url,
          alt_text: img.alt_text || null,
          display_order: idx,
        })),
      };

      if (productId) {
        return await updateProduct(productId, payload);
      } else {
        return await createProduct(payload);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", data.id] });
      toast.success(
        productId
          ? `Product "${data.title}" updated successfully`
          : `Product "${data.title}" created successfully`
      );
      router.push("/sys-admin-portal/products");
    },
    onError: (err: any) => {
      toast.error(err.message || "An error occurred while saving the product");
    },
  });

  const onSubmit = (values: ProductFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Top Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              asChild
              className="h-8 w-8"
              title="Back to Products"
            >
              <Link href="/sys-admin-portal/products" aria-label="Back to Products">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {productId ? "Edit Product" : "Create New Product"}
              </h1>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {productId ? `ID: ${productId}` : "CATALOG // NEW_RECORD"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/sys-admin-portal/products")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={mutation.isPending}
              className="gap-2 min-w-[120px]"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  {productId ? "Update Product" : "Publish Product"}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Details, Media, Variants */}
          <div className="lg:col-span-2 space-y-8">
            {/* 1. Basic Info Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">
                  General Information
                </CardTitle>
                <CardDescription className="text-xs">
                  Title, permanent slug identifier, and product description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Titanium Chronograph Watch"
                          {...field}
                          onChange={handleTitleChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="titanium-chronograph-watch"
                          className="font-mono text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Unique canonical route identifier (/products/{form.watch("slug") || "..."})
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description with Lightweight Rich Formatting Toolbar */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Description</FormLabel>
                        <div className="flex items-center gap-1 border border-border rounded-md p-0.5 bg-muted/40">
                          <button
                            type="button"
                            onClick={() => insertFormatting("**", "**")}
                            className="p-1 hover:bg-muted rounded text-xs text-muted-foreground hover:text-foreground"
                            title="Bold"
                          >
                            <Bold className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting("*", "*")}
                            className="p-1 hover:bg-muted rounded text-xs text-muted-foreground hover:text-foreground"
                            title="Italic"
                          >
                            <Italic className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting("## ")}
                            className="p-1 hover:bg-muted rounded text-xs text-muted-foreground hover:text-foreground"
                            title="Heading"
                          >
                            <Heading2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting("- ")}
                            className="p-1 hover:bg-muted rounded text-xs text-muted-foreground hover:text-foreground"
                            title="Bullet List"
                          >
                            <List className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting("`", "`")}
                            className="p-1 hover:bg-muted rounded text-xs text-muted-foreground hover:text-foreground"
                            title="Code"
                          >
                            <Code className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <FormControl>
                        <Textarea
                          id="product-description-editor"
                          rows={6}
                          placeholder="Provide detailed material specifications, dimensions, and craft details..."
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 2. Media Gallery (Supabase Storage Drag-and-Drop) */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">
                  Media Gallery
                </CardTitle>
                <CardDescription className="text-xs">
                  Upload high-resolution photography directly to Supabase Storage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drag and Drop Zone */}
                <div className="relative border-2 border-dashed border-border hover:border-foreground/40 rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors bg-muted/10 group">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:text-foreground mb-3 transition-colors">
                    {isUploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <UploadCloud className="h-5 w-5" />
                    )}
                  </div>
                  <div className="text-xs font-medium text-foreground">
                    {isUploading
                      ? "Uploading asset to storage..."
                      : "Drag & drop product imagery here, or browse"}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    JPEG, PNG, WEBP up to 5MB. Verified with Supabase Storage RLS.
                  </p>
                </div>

                {/* Uploaded Images List */}
                {imageFields.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {imageFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="group relative border border-border rounded-md overflow-hidden bg-card aspect-square flex flex-col justify-between"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={field.image_url}
                          alt={field.alt_text || "Product image"}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                          <button
                            type="button"
                            onClick={() => {
                              deleteProductImage(field.image_url);
                              removeImage(index);
                              toast.info("Image removed from gallery");
                            }}
                            className="h-7 w-7 rounded bg-destructive text-destructive-foreground flex items-center justify-center hover:opacity-90"
                            title="Delete Image"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="absolute top-1.5 left-1.5 bg-background/90 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-mono font-medium border border-border">
                          #{index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. Variant Manager (Dynamic Field Array) */}
            <Card>
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Product Variants & Inventory
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure SKU codes, attributes (Size, Color), stock levels, and price offsets
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const slug = form.getValues("slug") || "ITEM";
                    const count = variantFields.length + 1;
                    appendVariant({
                      sku: `${slug.toUpperCase().slice(0, 8)}-${String(count).padStart(3, "0")}`,
                      size: "",
                      color: "",
                      inventory_count: 0,
                      price_adjustment: 0,
                    });
                  }}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Variant
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="border border-border rounded-md overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 bg-muted/60 p-2.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border">
                    <div className="col-span-4">SKU Code *</div>
                    <div className="col-span-2">Size</div>
                    <div className="col-span-2">Color</div>
                    <div className="col-span-2">Stock *</div>
                    <div className="col-span-1">Adj ($)</div>
                    <div className="col-span-1 text-right">Del</div>
                  </div>

                  <div className="divide-y divide-border">
                    {variantFields.map((item, index) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-muted/20 transition-colors"
                      >
                        <div className="col-span-4">
                          <FormField
                            control={form.control}
                            name={`variants.${index}.sku`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="SKU-001"
                                    className="h-8 text-xs font-mono"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`variants.${index}.size`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="e.g. L"
                                    className="h-8 text-xs"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`variants.${index}.color`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="e.g. Onyx"
                                    className="h-8 text-xs"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`variants.${index}.inventory_count`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    className="h-8 text-xs font-mono"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        parseInt(e.target.value, 10) || 0
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="col-span-1">
                          <FormField
                            control={form.control}
                            name={`variants.${index}.price_adjustment`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="h-8 text-xs font-mono"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (variantFields.length <= 1) {
                                toast.error("Product must have at least one variant");
                                return;
                              }
                              removeVariant(index);
                            }}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded transition-colors"
                            title="Remove Variant"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column: Pricing, Publishing, Taxonomy, SEO */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Publishing Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="is_published"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/20">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs font-medium cursor-pointer">
                          Visibility
                        </FormLabel>
                        <FormDescription className="text-[11px]">
                          {field.value ? "Active in live catalog" : "Restricted to draft mode"}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-border accent-foreground cursor-pointer"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Pricing Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Pricing</CardTitle>
                <CardDescription className="text-xs">
                  Currency defaults to USD ($)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="base_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Price ($) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="99.00"
                          className="font-mono text-sm"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="compare_at_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compare-At Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="129.00"
                          className="font-mono text-sm"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? null
                                : parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        Original MSRP for strikethrough markdown
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Category / Taxonomy Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Category</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          value={field.value || "none"}
                          onValueChange={(val) =>
                            field.onChange(val === "none" ? null : val)
                          }
                        >
                          <SelectTrigger className="text-xs">
                            <SelectValue placeholder="Assign Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Category</SelectItem>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* SEO Metadata Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">SEO Indexing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="seo_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Meta Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brand | Product Title"
                          className="text-xs"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seo_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Meta Description</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Search engine summary snippet..."
                          className="text-xs"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
