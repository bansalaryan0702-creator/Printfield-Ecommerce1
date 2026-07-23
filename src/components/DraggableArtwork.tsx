import React, { useRef, useState, useEffect } from "react";

export const DraggableArtwork = ({
  children,
  defaultLeft,
  defaultTop,
  xOffset = 0,
  yOffset = 0,
  onUpdateOffset,
  className,
  style,
  onClick,
}: any) => {
  return (
    <div
      onClick={(e) => {
        if (onClick) onClick();
      }}
      className={className}
      style={{
        ...style,
        position: "absolute",
        left: `calc(${defaultLeft} + ${xOffset}px)`,
        top: `calc(${defaultTop} + ${yOffset}px)`,
        transform: style.transform || "translate(-50%, -50%)",
      }}
    >
      {children}
    </div>
  );
};
