export default function PropertyDescription({ description }) {
  return (
    <section>
      <h2 className="text-3xl font-extrabold text-[#0A1F44]">
        Property Description
      </h2>

      <div className="mt-2 h-[3px] w-16 bg-red-600 rounded-full" />

      <p className="mt-6 text-gray-700 leading-relaxed max-w-3xl">
        {description}
      </p>

      <button className="mt-4 text-sm font-medium text-[#0A1F44] hover:underline">
        Read More ↓
      </button>
    </section>
  );
}
