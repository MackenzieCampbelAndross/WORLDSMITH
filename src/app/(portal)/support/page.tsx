import React from "react";
import Link from "next/link";

const FAQ = [
  {
    question: "How do I submit a new project?",
    answer:
      "Open Projects, choose Create, and upload your floor plan. We handle the architectural interpretation and production.",
  },
  {
    question: "Where do I find delivered worlds?",
    answer: "Completed worlds appear under Deliverables and in the Completed section of Projects.",
  },
  {
    question: "How long does production take?",
    answer:
      "Timelines are confirmed after the plan review. Most visualization packages are delivered within two to four weeks.",
  },
];

export default function SupportPage() {
  return (
    <div className="min-w-0">
      <div>
        <h1 className="font-body text-[24px] font-semibold leading-none tracking-[-0.02em] text-[#17201b]">
          Support
        </h1>
        <p className="mt-2 font-body text-[11.5px] text-[#6f756d]">
          Questions about a project, a deliverable or your workspace.
        </p>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <section className="rounded-[14px] border border-[#e6e2d7] bg-white p-5">
          <h2 className="font-body text-[13px] font-semibold text-[#17201b]">Talk to the team</h2>
          <p className="mt-2 max-w-[440px] font-body text-[11px] leading-5 text-[#6f756d]">
            Send us a note and a producer will reply within one business day. Include the project name so we can pull
            up your files.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <a
              href="mailto:crestionlabs@gmail.com"
              className="inline-flex items-center gap-2 rounded-[7px] bg-[#143f2d] px-3.5 py-2 font-body text-[10.5px] font-medium text-[#f7f5ea] hover:bg-[#0f3626]"
            >
              crestionlabs@gmail.com
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-[7px] border border-[#ddd8ca] px-3.5 py-2 font-body text-[10.5px] text-[#5d675f] hover:border-[#1f4a36] hover:text-[#1f4a36]"
            >
              Visit website
            </Link>
          </div>

          <div className="mt-5 border-t border-[#f0ede4] pt-4">
            <p className="font-body text-[9px] font-semibold uppercase tracking-[0.14em] text-[#93988f]">
              Response times
            </p>
            <p className="mt-1.5 font-body text-[11px] text-[#4f5a52]">Monday – Friday · within one business day</p>
          </div>
        </section>

        <section className="rounded-[14px] border border-[#e6e2d7] bg-white p-5">
          <h2 className="font-body text-[13px] font-semibold text-[#17201b]">Common questions</h2>
          <div className="mt-3 space-y-2">
            {FAQ.map((item) => (
              <details key={item.question} className="group rounded-[9px] border border-[#ece8dd] px-3 py-2.5">
                <summary className="cursor-pointer list-none font-body text-[11px] font-medium text-[#263129] [&::-webkit-details-marker]:hidden">
                  {item.question}
                </summary>
                <p className="mt-1.5 font-body text-[10.5px] leading-4 text-[#7d857c]">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
