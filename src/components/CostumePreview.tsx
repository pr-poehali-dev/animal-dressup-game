import React from "react";

interface CostumePreviewProps {
  animalEmoji: string;
  primaryColor: string;
  secondaryColor: string;
  patternCss: string;
  clothType: string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

const CostumePreview: React.FC<CostumePreviewProps> = ({
  animalEmoji, primaryColor, secondaryColor, patternCss, clothType, size = "md", animate = false,
}) => {
  const sizes = { sm: { box: 80, emoji: "2rem" }, md: { box: 140, emoji: "3.5rem" }, lg: { box: 200, emoji: "5rem" } };
  const s = sizes[size];

  return (
    <div className={`flex flex-col items-center gap-2 ${animate ? "animate-float" : ""}`}>
      <div
        className="relative flex items-end justify-center rounded-3xl border-4 border-white shadow-lg overflow-hidden"
        style={{ width: s.box, height: s.box }}
      >
        {/* Outfit background with pattern */}
        <div
          className={`absolute inset-0 ${patternCss}`}
          style={{
            ["--p-color1" as string]: primaryColor,
            ["--p-color2" as string]: secondaryColor,
          }}
        />
        {/* Animal emoji */}
        <div
          className="relative z-10 text-center leading-none pb-2"
          style={{ fontSize: s.emoji, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}
        >
          {animalEmoji}
        </div>
        {/* Cloth label */}
        <div className="absolute top-1 left-1 right-1 text-center">
          <span className="text-white text-xs font-bold bg-black/30 rounded-full px-2 py-0.5">
            {clothType}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CostumePreview;
