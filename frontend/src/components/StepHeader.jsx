export default function StepHeader({ step, title, subtitle, onBack }) {
  const total = 4;
  return (
    <div className="mb-8">
      <button onClick={onBack}
        className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1 mb-5">
        ← Back
      </button>
      <div className="flex items-center gap-2 mb-5">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-300 w-10
            ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
        ))}
        <span className="text-xs text-gray-400 ml-1">Step {step} of {total}</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
