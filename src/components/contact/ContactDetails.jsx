import SaveContactButton from "./SaveContactButton";

export default function ContactDetails() {
  return (
    <div>
      <h3 className="text-2xl font-bold text-[#091D35]">
        Akshay Bansal
      </h3>

      <p className="mt-1 text-gray-600">
        Realtor at REMAX Nova
      </p>

      <div className="mt-8 space-y-4 text-gray-700">
        <p><strong>Phone:</strong> 902-399-5007</p>
        <p><strong>Email:</strong> info@therealtor.ca</p>
        <p><strong>Location:</strong> 397 Bedford Hwy, Halifax, NS</p>
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <a
          href="https://calendly.com/"
          target="_blank"
          className="rounded-full bg-red-600 px-8 py-3 text-sm font-semibold text-white hover:bg-red-700"
        >
          Schedule a Meeting
        </a>

        <SaveContactButton />
      </div>
    </div>
  );
}
