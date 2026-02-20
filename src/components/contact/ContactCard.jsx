import {
  Phone,
  Mail,
  MapPin,
  Globe,
  Linkedin,
  Instagram,
} from "lucide-react";
import SaveContactButton from "./SaveContactButton";

export default function ContactCard() {
  return (
    <div className="space-y-8">
      {/* NAME */}
      <div>
        <h2 className="text-3xl font-extrabold text-[#091D35]">
          Akshay Bansal
        </h2>
        <p className="mt-1 text-lg text-gray-600">
          Realtor at REMAX Nova
        </p>
      </div>

      {/* DETAILS */}
      <div className="space-y-4 text-[15px] text-gray-800">
     <div className="flex items-center gap-3">
  <Phone size={18} className="text-[#091D35]" />
  <a
    href="tel:+19023995007"
    className="hover:underline"
  >
    902-399-5007
  </a>
</div>

<div className="flex items-center gap-3">
  <Mail size={18} className="text-[#091D35]" />
  <a
    href="mailto:akshay@remaxnova.ca"
    className="hover:underline"
  >
    akshay@remaxnova.ca
  </a>
</div>

        <div className="flex items-center gap-3">
          <MapPin size={18} className="text-[#091D35]" />
          <span>397 Bedford Hwy, Halifax, NS</span>
        </div>

        <div className="flex items-center gap-3">
          <Globe size={18} className="text-[#091D35]" />
          <a
            href="https://remax.ca/ns/akshay-bansal-p102438618-ag"
            target="_blank"
            className="underline hover:text-[#091D35]"
          >
            remax.ca/ns/akshay-bansal
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Linkedin size={18} className="text-[#091D35]" />
          <a
            href="https://linkedin.com/in/akshaytherealtor"
            target="_blank"
            className="underline hover:text-[#091D35]"
          >
            LinkedIn
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Instagram size={18} className="text-[#091D35]" />
          <a
            href="https://instagram.com/akshaytherealtor"
            target="_blank"
            className="underline hover:text-[#091D35]"
          >
            Instagram
          </a>
        </div>
      </div>

      {/* BUTTONS */}
      <div className="pt-6 flex flex-wrap gap-4">
        <a
          href="https://akshay42hj.setmore.com"
          target="_blank"
           rel="noopener noreferrer"
          className="rounded-full bg-red-600 px-8 py-4 text-sm font-semibold text-white hover:bg-red-700 transition"
        >
          Schedule a Meeting
        </a>

        <SaveContactButton />
      </div>
    </div>
  );
}
