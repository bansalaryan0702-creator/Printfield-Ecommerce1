import React, { useMemo } from "react";
import { getColorStyle } from "../utils/colorUtils";

function resolveHexColor(colorInput: any): string {
  if (!colorInput) return "#ffffff";
  if (typeof colorInput === "object") {
    if (colorInput.hex && typeof colorInput.hex === "string" && colorInput.hex.startsWith("#")) {
      return colorInput.hex;
    }
    if (colorInput.name) {
      colorInput = colorInput.name;
    } else {
      return "#ffffff";
    }
  }
  const str = String(colorInput).trim();
  if (str.startsWith("#") || str.startsWith("rgb")) return str;

  const style = getColorStyle(str);
  if (style.background) {
    if (style.background.startsWith("#") || style.background.startsWith("rgb")) {
      return style.background;
    }
    const match = style.background.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/);
    if (match) return match[0];
  }
  return "#ffffff";
}

import { motion } from "motion/react";
import { DraggableArtwork } from "./DraggableArtwork";

interface Artwork {
  file?: File;
  previewUrl: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  dimensions?: { width: number; height: number };
  scale?: number;
  x?: number;
  y?: number;
  [key: string]: any;
}

export type PlacementId = string;

interface Apparel2DMockupProps {
  color: any;
  artworks: Record<string, Artwork | any>;
  activePlacement: PlacementId;
  onSelectPlacement?: (id: any) => void;
  onUpdateArtwork?: (placement: string, updates: any) => void;
  isPolo?: boolean;
  currentView: "front" | "back" | "left" | "right" | string;
  onViewChange: (view: "front" | "back" | "left" | "right") => void;
}

export const Apparel2DMockup: React.FC<Apparel2DMockupProps> = ({
  color,
  artworks,
  activePlacement,
  onSelectPlacement,
  onUpdateArtwork,
  isPolo = false,
  currentView,
  onViewChange,
}) => {
  const hexColor = useMemo(() => resolveHexColor(color) || "#18181b", [color]);

  // Determine if color is very light (e.g. white or near white) for stroke borders
  const isLightColor = useMemo(() => {
    if (!hexColor || !hexColor.startsWith("#")) return false;
    const hex = hexColor.replace("#", "");
    if (hex.length !== 6) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return r > 220 && g > 220 && b > 220;
  }, [hexColor]);

  const outlineStroke = isLightColor ? "#cbd5e1" : "rgba(0,0,0,0.2)";

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative bg-gradient-to-b from-slate-100 to-slate-200/70 p-4 rounded-3xl select-none">
      {/* View Selector Controls inside Mockup */}
      <div className="absolute top-3 left-3 z-30 flex items-center bg-white/90 backdrop-blur-md p-1 rounded-full border border-gray-200 shadow-sm gap-1">
        <button
          type="button"
          onClick={() => onViewChange("front")}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
            currentView === "front"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Front
        </button>
        <button
          type="button"
          onClick={() => onViewChange("back")}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
            currentView === "back"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => onViewChange("left")}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
            currentView === "left"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Left Sleeve
        </button>
        <button
          type="button"
          onClick={() => onViewChange("right")}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
            currentView === "right"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Right Sleeve
        </button>
      </div>

      {/* Main 2D T-Shirt Mockup Canvas using user-provided Drive Mockups */}
      <div className="relative w-full h-full max-w-[640px] aspect-[16/9] flex items-center justify-center overflow-hidden rounded-2xl shadow-lg border border-slate-200/80 bg-white">
        {/* Wrapper to scale and translate both image and overlays together */}
        <div 
          className={`relative w-full h-full flex items-center justify-center transition-transform duration-300 ${
            (currentView === "front" || currentView === "back") 
              ? "scale-[1.35] translate-y-[6%] -translate-x-[5%]" 
              : "scale-[1.35] translate-y-[6%]"
          }`}
        >
          {/* Drive Mockup Base Image */}
          <img
            src={
              currentView === "back"
                ? "/mockups/mockup_back.png"
                : currentView === "left"
                ? "/mockups/mockup_left.png"
                : currentView === "right"
                ? "/mockups/mockup_right.png"
                : "/mockups/mockup_front.png"
            }
            alt={`Apparel 2D Mockup - ${currentView}`}
            className={`w-full h-full object-contain select-none`}
          />

          {/* Color Tint Overlay if non-white color selected */}
          {hexColor && hexColor !== "#ffffff" && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-60"
              style={{ backgroundColor: hexColor }}
            />
          )}

          {/* Artwork Placement Overlays over Drive Mockup */}
          <div className="absolute inset-0 pointer-events-none">
          {/* FRONT VIEW PLACEMENTS */}
          {currentView === "front" && (
            <>
              {/* Left Chest Logo (Wearer's Left = Viewer's Right) */}
              {artworks["front-chest"]?.previewUrl && (
                <DraggableArtwork
                  defaultLeft="64%"
                  defaultTop="33%"
                  xOffset={artworks["front-chest"].x}
                  yOffset={artworks["front-chest"].y}
                  onUpdateOffset={(offsets: any) => onUpdateArtwork?.("front-chest", offsets)}
                  style={{
                    width: `${Math.round(8 * (artworks["front-chest"].scale || 1))}%`,
                  }}
                  onClick={() => onSelectPlacement?.("front-chest")}
                  className={`pointer-events-auto aspect-square transition-all ${
                    activePlacement === "front-chest"
                      ? "ring-2 ring-purple-500 ring-dashed rounded-lg p-0.5 bg-purple-500/10 z-20"
                      : "hover:ring-1 hover:ring-purple-300 rounded-lg z-10"
                  }`}
                >
                  <img
                    src={artworks["front-chest"].previewUrl}
                    alt="Left Chest Logo"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </DraggableArtwork>
              )}

              {/* Center Full Chest Logo */}
              {artworks["front-full"]?.previewUrl && (
                <DraggableArtwork
                  defaultLeft="57%"
                  defaultTop="40%"
                  xOffset={artworks["front-full"].x}
                  yOffset={artworks["front-full"].y}
                  onUpdateOffset={(offsets: any) => onUpdateArtwork?.("front-full", offsets)}
                  style={{
                    width: `${Math.round(18 * (artworks["front-full"].scale || 1))}%`,
                  }}
                  onClick={() => onSelectPlacement?.("front-full")}
                  className={`pointer-events-auto aspect-square transition-all ${
                    activePlacement === "front-full"
                      ? "ring-2 ring-purple-500 ring-dashed rounded-lg p-0.5 bg-purple-500/10 z-20"
                      : "hover:ring-1 hover:ring-purple-300 rounded-lg z-10"
                  }`}
                >
                  <img
                    src={artworks["front-full"].previewUrl}
                    alt="Full Chest Logo"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </DraggableArtwork>
              )}

              {/* Sleeve Left Indicator on Front View */}
              {artworks["sleeve-left"]?.previewUrl && (
                <DraggableArtwork
                  defaultLeft="81%"
                  defaultTop="35%"
                  xOffset={artworks["sleeve-left"].x}
                  yOffset={artworks["sleeve-left"].y}
                  onUpdateOffset={(offsets: any) => onUpdateArtwork?.("sleeve-left", offsets)}
                  style={{
                    transform: "translate(-50%, -50%) rotate(10deg)",
                    width: `${Math.round(6 * (artworks["sleeve-left"].scale || 1))}%`,
                  }}
                  onClick={() => {
                    onViewChange("left");
                    onSelectPlacement?.("sleeve-left");
                  }}
                  className={`pointer-events-auto aspect-square transition-all ${
                    activePlacement === "sleeve-left"
                      ? "ring-2 ring-purple-500 ring-dashed rounded-lg p-0.5 bg-purple-500/10 z-20"
                      : "hover:ring-1 hover:ring-purple-300 rounded-lg z-10"
                  }`}
                >
                  <img
                    src={artworks["sleeve-left"].previewUrl}
                    alt="Left Sleeve Logo"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </DraggableArtwork>
              )}

              {/* Sleeve Right Indicator on Front View */}
              {artworks["sleeve-right"]?.previewUrl && (
                <DraggableArtwork
                  defaultLeft="30%"
                  defaultTop="35%"
                  xOffset={artworks["sleeve-right"].x}
                  yOffset={artworks["sleeve-right"].y}
                  onUpdateOffset={(offsets: any) => onUpdateArtwork?.("sleeve-right", offsets)}
                  style={{
                    transform: "translate(-50%, -50%) rotate(-10deg)",
                    width: `${Math.round(6 * (artworks["sleeve-right"].scale || 1))}%`,
                  }}
                  onClick={() => {
                    onViewChange("right");
                    onSelectPlacement?.("sleeve-right");
                  }}
                  className={`pointer-events-auto aspect-square transition-all ${
                    activePlacement === "sleeve-right"
                      ? "ring-2 ring-purple-500 ring-dashed rounded-lg p-0.5 bg-purple-500/10 z-20"
                      : "hover:ring-1 hover:ring-purple-300 rounded-lg z-10"
                  }`}
                >
                  <img
                    src={artworks["sleeve-right"].previewUrl}
                    alt="Right Sleeve Logo"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </DraggableArtwork>
              )}
            </>
          )}

          {/* BACK VIEW PLACEMENTS */}
          {currentView === "back" && (
            <>
              {artworks["back-full"]?.previewUrl && (
                <DraggableArtwork
                  defaultLeft="57%"
                  defaultTop="40%"
                  xOffset={artworks["back-full"].x}
                  yOffset={artworks["back-full"].y}
                  onUpdateOffset={(offsets: any) => onUpdateArtwork?.("back-full", offsets)}
                  style={{
                    width: `${Math.round(18 * (artworks["back-full"].scale || 1))}%`,
                  }}
                  onClick={() => onSelectPlacement?.("back-full")}
                  className={`pointer-events-auto aspect-square transition-all ${
                    activePlacement === "back-full"
                      ? "ring-2 ring-purple-500 ring-dashed rounded-lg p-0.5 bg-purple-500/10 z-20"
                      : "hover:ring-1 hover:ring-purple-300 rounded-lg z-10"
                  }`}
                >
                  <img
                    src={artworks["back-full"].previewUrl}
                    alt="Back Full Logo"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </DraggableArtwork>
              )}
            </>
          )}

          {/* LEFT SLEEVE VIEW PLACEMENTS */}
          {currentView === "left" && (
            <>
              {artworks["sleeve-left"]?.previewUrl && (
                <DraggableArtwork
                  defaultLeft="38%"
                  defaultTop="48%"
                  xOffset={artworks["sleeve-left"].x}
                  yOffset={artworks["sleeve-left"].y}
                  onUpdateOffset={(offsets: any) => onUpdateArtwork?.("sleeve-left", offsets)}
                  style={{
                    width: `${Math.round(14 * (artworks["sleeve-left"].scale || 1))}%`,
                  }}
                  onClick={() => onSelectPlacement?.("sleeve-left")}
                  className={`pointer-events-auto aspect-square transition-all ${
                    activePlacement === "sleeve-left"
                      ? "ring-2 ring-purple-500 ring-dashed rounded-lg p-0.5 bg-purple-500/10 z-20"
                      : "hover:ring-1 hover:ring-purple-300 rounded-lg z-10"
                  }`}
                >
                  <img
                    src={artworks["sleeve-left"].previewUrl}
                    alt="Left Sleeve Logo"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </DraggableArtwork>
              )}
            </>
          )}

          {/* RIGHT SLEEVE VIEW PLACEMENTS */}
          {currentView === "right" && (
            <>
              {artworks["sleeve-right"]?.previewUrl && (
                <DraggableArtwork
                  defaultLeft="38%"
                  defaultTop="48%"
                  xOffset={artworks["sleeve-right"].x}
                  yOffset={artworks["sleeve-right"].y}
                  onUpdateOffset={(offsets: any) => onUpdateArtwork?.("sleeve-right", offsets)}
                  style={{
                    width: `${Math.round(14 * (artworks["sleeve-right"].scale || 1))}%`,
                  }}
                  onClick={() => onSelectPlacement?.("sleeve-right")}
                  className={`pointer-events-auto aspect-square transition-all ${
                    activePlacement === "sleeve-right"
                      ? "ring-2 ring-purple-500 ring-dashed rounded-lg p-0.5 bg-purple-500/10 z-20"
                      : "hover:ring-1 hover:ring-purple-300 rounded-lg z-10"
                  }`}
                >
                  <img
                    src={artworks["sleeve-right"].previewUrl}
                    alt="Right Sleeve Logo"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </DraggableArtwork>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};
