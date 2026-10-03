import { ProductForm } from "@/components/admin/products/product-form";

export const metadata = {
  title: "New Product | Admin Control Plane",
};

export default function NewProductPage() {
  return (
    <div className="max-w-6xl mx-auto py-2">
      <ProductForm />
    </div>
  );
}
