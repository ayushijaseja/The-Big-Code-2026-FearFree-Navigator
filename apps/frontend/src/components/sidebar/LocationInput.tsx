interface Props {
  label: string;
  value: string;
  onChange: (val: string) => void;
  icon: React.ReactNode;
  action?: React.ReactNode;
}

export const LocationInput = ({ label, value, onChange, icon, action }: Props) => (
  <div className="relative">
    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">{label}</label>
    <div className="relative">
      <input 
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 pl-10 text-sm outline-none focus:border-green-500 transition-all"
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>
      {action && <div className="absolute right-3 top-1/2 -translate-y-1/2">{action}</div>}
    </div>
  </div>
);