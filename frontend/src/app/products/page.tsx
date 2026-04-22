import { Suspense } from "react";
import ProductsContent from "./products-content";

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center transition-colors">
          <div className="animate-spin">
            <div className="h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full"></div>
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
