export default function SaveContactButton() {
  return (
    <a
      href="/akshay-bansal.vcf"
      download
      className="rounded-full border border-[#091D35] px-8 py-4 text-sm font-semibold text-[#091D35] hover:bg-[#091D35] hover:text-white transition"
    >
      Save as Contact
    </a>
  );
}
