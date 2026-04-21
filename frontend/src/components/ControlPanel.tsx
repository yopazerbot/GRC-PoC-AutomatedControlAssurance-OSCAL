export default function ControlPanel() {
  return (
    <div className="panel flex flex-col gap-2 overflow-auto">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Control</h2>
      <h3 className="text-base font-bold">A.8.5 Secure Authentication</h3>
      <p className="text-sm text-gray-300 leading-relaxed">
        Secure authentication technologies and procedures shall be established and implemented based on information access restrictions and the topic-specific policy on access control.
      </p>
      <div className="mt-2 p-2 rounded bg-gray-800/50 border border-gray-700/50">
        <p className="text-xs text-gray-400 font-medium mb-1">Scope (this demo)</p>
        <p className="text-sm text-blue-300">
          Guest users accessing tenant resources MUST be protected by MFA via Conditional Access.
        </p>
      </div>
      <p className="text-xs text-gray-500 mt-auto">ISO/IEC 27001:2022 | Annex A - Technological Controls</p>
    </div>
  );
}
