"use client";

export default function OnboardingTooltip({
  show,
  text,
  placement = "bottom",
  children,
}: {
  show: boolean;
  text: string;
  placement?: "top" | "bottom";
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      {show && (
        <div
          className={[
            "absolute left-1/2 z-50 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 animate-bounce",
            placement === "bottom" ? "top-full mt-2" : "bottom-full mb-2",
          ].join(" ")}
        >
          <div className="relative rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white shadow-lg">
            {text}
            <div
              className={[
                "absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-teal-600",
                placement === "bottom" ? "-top-1" : "-bottom-1",
              ].join(" ")}
            />
          </div>
        </div>
      )}
    </div>
  );
}
