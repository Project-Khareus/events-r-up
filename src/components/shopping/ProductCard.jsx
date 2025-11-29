import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { useCart } from "./CartContext";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  return (
    <Card className="group overflow-hidden border border-slate-200 hover:border-slate-300 transition-all duration-300 bg-white">
      <Link to={createPageUrl(`ProductDetail?id=${product.id}`)} className="block relative h-48 overflow-hidden bg-slate-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            No Image
          </div>
        )}
      </Link>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{product.category}</p>
            <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}>
              <h3 className="font-serif font-semibold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                {product.name}
              </h3>
            </Link>
          </div>
          <span className="font-bold text-slate-900">${product.price}</span>
        </div>
        
        <p className="text-sm text-slate-600 line-clamp-2 mb-4 min-h-[40px]">
          {product.description}
        </p>
        
        <Button 
          onClick={() => addToCart(product)}
          className="w-full bg-slate-900 hover:bg-slate-800 gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </Button>
      </div>
    </Card>
  );
}