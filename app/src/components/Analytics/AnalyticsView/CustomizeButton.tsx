import { PaletteIcon, CheckIcon } from "@phosphor-icons/react";
import {
  useDashboardCustomization,
  useVisibilityToggle,
  chartThemes,
  chartThemeIds,
  multiSwatchColors,
} from "@vonlabs/design-components";

const CustomizeButton: React.FC = () => {
  const { colorTheme, setColorTheme } = useDashboardCustomization();
  const { isVisible, hide, toggleVisibility } = useVisibilityToggle();

  return (
    <div className="relative">
      <button
        onClick={toggleVisibility}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-xl border transition-colors cursor-pointer ${
          isVisible
            ? "bg-gray-50 border-gray-300 text-gray-900"
            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
        }`}
      >
        <PaletteIcon size={14} />
        Customize
      </button>

      {isVisible && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={hide} />
          <div className="absolute left-0 top-full mt-1.5 z-[9999] bg-white rounded-xl border border-gray-200 shadow-sm p-3">
            <p className="text-xs font-medium text-gray-900 mb-2">
              Color theme
            </p>
            <div className="flex items-center gap-2.5">
              {chartThemeIds.map((id) => {
                const theme = chartThemes[id];
                const isActive = id === colorTheme;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setColorTheme(id);
                      hide();
                    }}
                    className="flex flex-col items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                    title={theme.label}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? "ring-2 ring-offset-2 ring-gray-300"
                          : "hover:scale-110"
                      }`}
                      style={
                        theme.swatch === "multi"
                          ? {
                              background: `conic-gradient(${multiSwatchColors[0]} 0deg 90deg, ${multiSwatchColors[1]} 90deg 180deg, ${multiSwatchColors[2]} 180deg 270deg, ${multiSwatchColors[3]} 270deg 360deg)`,
                            }
                          : { backgroundColor: theme.swatch }
                      }
                    >
                      {isActive && (
                        <CheckIcon
                          size={12}
                          weight="bold"
                          className="text-white"
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {theme.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export { CustomizeButton };
