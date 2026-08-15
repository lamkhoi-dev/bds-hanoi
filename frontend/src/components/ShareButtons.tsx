"use client";
import { useState, useEffect } from "react";
import { Share2, Facebook, MessageCircle, Link as LinkIcon, Check } from "lucide-react";

export default function ShareButtons({ url, title }: { url?: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(url || window.location.href);
  }, [url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const shareToZalo = () => {
    window.open(
      `https://zalo.me/share?v=1&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title || "")}`,
      "_blank",
      "width=600,height=400"
    );
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-textSecondary mr-1 hidden sm:inline-block"><Share2 className="w-4 h-4 inline mr-1"/> Chia sẻ:</span>
      <button
        onClick={shareToFacebook}
        className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
        title="Chia sẻ lên Facebook"
      >
        <Facebook className="w-4 h-4" />
      </button>
      <button
        onClick={shareToZalo}
        className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors"
        title="Chia sẻ lên Zalo"
      >
        <MessageCircle className="w-4 h-4" />
      </button>
      <button
        onClick={handleCopy}
        className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200 transition-colors"
        title="Copy Link"
      >
        {copied ? <Check className="w-4 h-4 text-green-600" /> : <LinkIcon className="w-4 h-4" />}
      </button>
    </div>
  );
}
