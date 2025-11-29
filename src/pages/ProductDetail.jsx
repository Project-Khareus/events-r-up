import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "../components/shopping/CartContext";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => base44.entities.Product.get(id),
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Skeleton className="h-[500px] w-full rounded-xl" />
    </div>
  );

  if (!product) return (
    <div className="max-w-6xl mx-auto px-6 py-20 text-center">
      <h2 className="text-2xl font-bold">Product not found</h2>
      <Link to={createPageUrl("Shop")} className="text-indigo-600 hover:underline mt-4 block">Back to Shop</Link>
    </div>
  );

  const handleAdd = () => {
    addToCart(product, qty);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 min-h-screen">
      <Link to={createPageUrl("Shop")} className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Shop
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Image */}
        <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-8">
          <div>
            <span className="text-sm font-semibold tracking-widest text-indigo-600 uppercase mb-2 block">{product.category}</span>
            <h1 className="text-4xl font-serif font-bold text-slate-900 mb-4">{product.name}</h1>
            <p className="text-3xl font-medium text-slate-900">${product.price}</p>
          </div>

          <div className="prose prose-slate text-slate-600">
            <p>{product.description}</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700">Quantity</span>
              <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                <button 
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-2 hover:bg-slate-100 text-slate-600"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-medium text-slate-900">{qty}</span>
                <button 
                  onClick={() => setQty(qty + 1)}
                  className="p-2 hover:bg-slate-100 text-slate-600"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Button onClick={handleAdd} size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg h-12">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart - ${(product.price * qty).toFixed(2)}
            </Button>
            
            <p className="text-center text-xs text-slate-500">
              Secure checkout powered by Events R'Up
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}