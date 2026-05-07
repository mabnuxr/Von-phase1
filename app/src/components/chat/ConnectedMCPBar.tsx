import { useState } from "react";
import { CaretDown, Plugs, WarningCircle } from "@phosphor-icons/react";
import type { MCPServer, MCPToolInfo } from "../../types/mcp";

interface ConnectedMCPBarProps {
  servers: MCPServer[];
}

export function ConnectedMCPBar({ servers }: ConnectedMCPBarProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (servers.length === 0) return null;

  const expandedServer = servers.find((s) => s.id === expandedId);

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mr-1">
          Active tools
        </span>
        {servers.map((server) => (
          <button
            key={server.id}
            onClick={() =>
              setExpandedId(expandedId === server.id ? null : server.id)
            }
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              expandedId === server.id
                ? "bg-purple-100 text-purple-800 border border-purple-200"
                : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <span className="px-1 py-0.5 text-[9px] font-bold bg-purple-100 text-purple-700 rounded">
              MCP
            </span>
            {server.name}
            <span className="text-gray-400">—</span>
            <span className="text-gray-500">
              {server.tool_manifest.length} tool
              {server.tool_manifest.length !== 1 ? "s" : ""}
            </span>
            <CaretDown
              size={10}
              weight="bold"
              className={`text-gray-400 transition-transform ${expandedId === server.id ? "rotate-180" : ""}`}
            />
          </button>
        ))}
      </div>

      {expandedServer && (
        <div className="mt-2 border border-gray-200 rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
            <Plugs size={12} className="text-gray-400 shrink-0" />
            <span className="text-xs font-medium text-gray-700">
              {expandedServer.name}
            </span>
            {expandedServer.tool_manifest.length > 0 && (
              <span className="ml-auto text-[10px] text-gray-400">
                {expandedServer.tool_manifest.length} tools
              </span>
            )}
          </div>
          <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
            {expandedServer.tool_manifest.map((tool: MCPToolInfo) => (
              <div key={tool.name} className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-gray-800">
                    {tool.name}
                  </span>
                  {tool.is_write && (
                    <span className="flex items-center gap-0.5 px-1 py-0.5 text-[9px] font-semibold bg-amber-100 text-amber-700 rounded">
                      <WarningCircle size={8} />
                      Write
                    </span>
                  )}
                </div>
                {tool.description && (
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    {tool.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
