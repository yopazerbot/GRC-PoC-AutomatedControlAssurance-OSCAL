import { useEffect, useState } from "react";
import type { ArtifactMeta, RunDetail } from "../types";
import { fetchArtifacts } from "../api";

interface Props {
  run: RunDetail | null;
}

export default function TracePanel({ run }: Props) {
  const [artifacts, setArtifacts] = useState<ArtifactMeta[]>([]);

  useEffect(() => {
    fetchArtifacts().then(setArtifacts).catch(() => {});
  }, []);

  const chain = [
    { label: "Catalog", type: "catalog" },
    { label: "Profile", type: "profile" },
    { label: "SSP", type: "ssp" },
    { label: "Assessment Plan", type: "assessment-plan" },
    { label: "Assessment Results", type: "assessment-results" },
  ];

  const resultUuid = run
    ? (run.assessment_results as any)?.["assessment-results"]?.uuid
    : null;

  return (
    <div className="panel flex flex-col gap-2 overflow-auto">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">OSCAL Trace</h2>
      <div className="flex flex-col gap-1">
        {chain.map((item, i) => {
          const artifact = artifacts.find((a) => a.type === item.type);
          const uuid = item.type === "assessment-results"
            ? resultUuid
            : artifact?.uuid;
          const hasData = item.type === "assessment-results" ? !!run : !!artifact;

          return (
            <div key={item.type}>
              <div className={`flex items-center gap-2 p-1.5 rounded text-sm
                ${hasData ? "text-gray-200" : "text-gray-500"}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0
                  ${hasData ? "bg-emerald-500" : "bg-gray-600"}`} />
                <span className="font-medium">{item.label}</span>
                {uuid && (
                  <span className="text-[10px] font-mono text-gray-500 ml-auto">
                    {uuid.slice(0, 8)}...
                  </span>
                )}
              </div>
              {i < chain.length - 1 && (
                <div className="ml-[7px] h-2 border-l border-gray-600/50" />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-500 mt-auto">End-to-end OSCAL traceability chain</p>
    </div>
  );
}
