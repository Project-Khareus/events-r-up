import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MobileHeader({ title, rightAction }) {
  const navigate = useNavigate();

  return (
    <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(-1)}
        className="h-9 w-9"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      
      {title && (
        <h1 className="text-lg font-semibold text-slate-900 truncate flex-1 text-center mx-2">
          {title}
        </h1>
      )}
      
      {rightAction ? (
        <div className="w-9">{rightAction}</div>
      ) : (
        <div className="w-9" />
      )}
    </div>
  );
}