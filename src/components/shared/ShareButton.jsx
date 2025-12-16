import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, Facebook, Twitter, Linkedin, Mail } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function ShareButton({ 
  url, 
  title, 
  description,
  variant = "outline",
  size = "default",
  className = ""
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || window.location.href;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error("Failed to share");
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const shareToSocial = (platform) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title || "");
    const encodedDescription = encodeURIComponent(description || "");

    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], "_blank", "width=600,height=400");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-600" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              <span>Copy Link</span>
            </>
          )}
        </DropdownMenuItem>
        
        {navigator.share && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleNativeShare}>
              <Share2 className="mr-2 h-4 w-4" />
              <span>Share via...</span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => shareToSocial("facebook")}>
          <Facebook className="mr-2 h-4 w-4 text-blue-600" />
          <span>Share on Facebook</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => shareToSocial("twitter")}>
          <Twitter className="mr-2 h-4 w-4 text-sky-500" />
          <span>Share on Twitter</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => shareToSocial("linkedin")}>
          <Linkedin className="mr-2 h-4 w-4 text-blue-700" />
          <span>Share on LinkedIn</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => shareToSocial("email")}>
          <Mail className="mr-2 h-4 w-4 text-slate-600" />
          <span>Share via Email</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}