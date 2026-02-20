export default function ContactSection({ children }) {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-20">
        {children}
      </div>
    </section>
  );
}
