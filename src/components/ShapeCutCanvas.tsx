import React, { useEffect, useRef, useState } from "react";

interface ShapeCutCanvasProps {
  artworkUrl: string;
  productImageUrl?: string;
  productName?: string;
  cardShape?: string;
  className?: string;
  isBackView?: boolean;
}

export const ShapeCutCanvas: React.FC<ShapeCutCanvasProps> = ({
  artworkUrl,
  productImageUrl,
  productName = "",
  cardShape = "Standard",
  className = "",
  isBackView = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function processAndDraw() {
      if (!artworkUrl) return;
      setLoading(true);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Load artwork image
      const artImg = new Image();
      artImg.crossOrigin = "anonymous";
      artImg.referrerPolicy = "no-referrer";

      await new Promise<void>((resolve) => {
        artImg.onload = () => resolve();
        artImg.onerror = () => resolve();
        artImg.src = artworkUrl;
      });

      if (isCancelled || !artImg.naturalWidth || !artImg.naturalHeight) return;

      // High DPI canvas dimensions based on artwork aspect ratio
      const maxDim = 1200;
      let width = artImg.naturalWidth;
      let height = artImg.naturalHeight;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      width = Math.max(width, 400);
      height = Math.max(height, 250);

      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);
      ctx.save();

      if (isBackView) {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }

      const shapeLower = `${cardShape} ${productName}`.toLowerCase();

      // Card boundary margin for realistic drop shadow and stroke
      const margin = Math.round(Math.min(width, height) * 0.035);
      const cardW = width - margin * 2;
      const cardH = height - margin * 2;
      const cardX = margin;
      const cardY = margin;

      // Check explicit geometric shape keywords
      const isUShape = shapeLower.includes("u-shape") || shapeLower.includes("u shape") || shapeLower.includes("arch") || shapeLower.includes("half moon") || shapeLower.includes("u cut") || shapeLower.includes("u-cut");
      const isLeaf = shapeLower.includes("leaf");
      const isCircle = shapeLower.includes("circle") || shapeLower.includes("round card");
      const isOval = shapeLower.includes("oval");
      const isSingleRound = shapeLower.includes("single round") || shapeLower.includes("1 round");
      const isDualRound = shapeLower.includes("2 round") || shapeLower.includes("two round") || shapeLower.includes("dual round");
      const isRounded = shapeLower.includes("rounded") || shapeLower.includes("round corner");
      const isSquare = shapeLower.includes("square") || shapeLower.includes("standard");

      // Construct path for card stock silhouette
      ctx.beginPath();

      if (isUShape) {
        // U-Shape / Arch visiting card shape
        if (cardH >= cardW * 1.05) {
          // Portrait U-Shape / Arch (Top is arch dome, bottom corners rounded)
          const archR = cardW / 2;
          const rBot = Math.round(cardW * 0.06);

          ctx.moveTo(cardX, cardY + archR);
          // Top Arch Dome
          ctx.arc(cardX + archR, cardY + archR, archR, Math.PI, 0, false);
          // Right Wall
          ctx.lineTo(cardX + cardW, cardY + cardH - rBot);
          // Bottom-Right Corner
          ctx.arcTo(cardX + cardW, cardY + cardH, cardX + cardW - rBot, cardY + cardH, rBot);
          // Bottom Wall
          ctx.lineTo(cardX + rBot, cardY + cardH);
          // Bottom-Left Corner
          ctx.arcTo(cardX, cardY + cardH, cardX, cardY + cardH - rBot, rBot);
          // Left Wall
          ctx.closePath();
        } else {
          // Landscape U-Shape / Arch (Arch dome across top)
          const archR = cardH * 0.75;
          const rBot = Math.round(cardH * 0.06);

          ctx.moveTo(cardX, cardY + cardH - rBot);
          // Left wall going up
          ctx.lineTo(cardX, cardY + archR);
          // Top-left arch
          ctx.arcTo(cardX, cardY, cardX + archR, cardY, archR);
          // Top wall
          ctx.lineTo(cardX + cardW - archR, cardY);
          // Top-right arch
          ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + archR, archR);
          // Right wall going down
          ctx.lineTo(cardX + cardW, cardY + cardH - rBot);
          // Bottom right corner
          ctx.arcTo(cardX + cardW, cardY + cardH, cardX + cardW - rBot, cardY + cardH, rBot);
          // Bottom wall
          ctx.lineTo(cardX + rBot, cardY + cardH);
          // Bottom left corner
          ctx.arcTo(cardX, cardY + cardH, cardX, cardY + cardH - rBot, rBot);
          ctx.closePath();
        }
      } else if (isLeaf) {
        // Leaf shape (Top-Left & Bottom-Right large rounded arcs)
        const rLarge = Math.round(Math.min(cardW, cardH) * 0.42);
        const rSmall = 6;
        ctx.roundRect(cardX, cardY, cardW, cardH, [rLarge, rSmall, rLarge, rSmall]);
      } else if (isCircle) {
        // Circle shape
        const radius = Math.min(cardW, cardH) / 2;
        ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
      } else if (isOval) {
        // Oval shape
        ctx.ellipse(width / 2, height / 2, cardW / 2, cardH / 2, 0, 0, Math.PI * 2);
      } else if (isSingleRound) {
        // Single round corner
        const rLarge = Math.round(Math.min(cardW, cardH) * 0.42);
        const rSmall = 6;
        ctx.roundRect(cardX, cardY, cardW, cardH, [rLarge, rSmall, rSmall, rSmall]);
      } else if (isDualRound) {
        // Dual round corners
        const rLarge = Math.round(Math.min(cardW, cardH) * 0.35);
        const rSmall = 6;
        ctx.roundRect(cardX, cardY, cardW, cardH, [rLarge, rLarge, rSmall, rSmall]);
      } else if (isRounded) {
        // Rounded corners
        const r = Math.round(Math.min(cardW, cardH) * 0.08);
        ctx.roundRect(cardX, cardY, cardW, cardH, r);
      } else if (isSquare) {
        // Standard square corners
        const r = 4;
        ctx.roundRect(cardX, cardY, cardW, cardH, r);
      } else {
        // Custom Die Cut or Default rounded card
        const r = Math.round(Math.min(cardW, cardH) * 0.06);
        ctx.roundRect(cardX, cardY, cardW, cardH, r);
      }

      // 1. Draw realistic soft drop shadow behind the card stock
      ctx.save();
      ctx.shadowColor = "rgba(15, 23, 42, 0.18)";
      ctx.shadowBlur = 22;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.restore();

      // 2. Draw fine crisp border stroke along card edge
      ctx.save();
      ctx.strokeStyle = "rgba(203, 213, 225, 0.95)"; // Slate 300
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // 3. Clip artwork precisely to card stock path
      ctx.save();
      ctx.clip();

      // Base pure white card stock surface
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(cardX, cardY, cardW, cardH);

      // Draw uploaded artwork image covering card stock
      ctx.drawImage(artImg, cardX, cardY, cardW, cardH);

      ctx.restore();

      ctx.restore();
      setLoading(false);
    }

    processAndDraw();

    return () => {
      isCancelled = true;
    };
  }, [artworkUrl, productImageUrl, productName, cardShape, isBackView]);

  return (
    <div className={`relative w-full h-full flex items-center justify-center p-4 bg-slate-50/80 rounded-3xl ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-xs z-20 rounded-3xl">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div className="relative w-full h-full flex items-center justify-center transition-transform hover:scale-[1.01]">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-[520px] object-contain rounded-2xl pointer-events-none filter drop-shadow-md"
        />
      </div>
    </div>
  );
};
