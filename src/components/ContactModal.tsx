"use client";

import React, { useState } from "react";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    projectType: "Masterplanned Development",
    message: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2400);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#184834] border border-[#a8cebc]/30 rounded-lg p-6 sm:p-8 text-[#f0f1e6] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 text-sm font-mono text-[#a8cebc] hover:text-[#f0f1e6] transition-colors p-1"
        >
          [ESC] ✕
        </button>

        <div className="mb-6">
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#a8cebc] block mb-1">
            Initiate Engagement
          </span>
          <h2 id="contact-heading" className="text-2xl font-serif font-light text-[#f0f1e6]">
            Architectural Inquiries
          </h2>
          <p className="text-xs text-[#a8cebc]/80 mt-1">
            Connect with our spatial design studio to prototype your upcoming development.
          </p>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#d0e5d3]/20 border border-[#d0e5d3] mx-auto flex items-center justify-center text-[#d0e5d3] font-mono text-xs">
              ✓
            </div>
            <p className="font-serif text-lg text-[#f0f1e6]">Transmission Received</p>
            <p className="text-xs font-mono text-[#a8cebc]">
              A principal worldsmith director will respond within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-[11px] font-mono text-[#a8cebc] uppercase mb-1">
                Name & Organization
              </label>
              <input
                id="name"
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Eleanor Vance / Meridian Capital"
                className="w-full bg-[#133b2a] border border-[#a8cebc]/30 rounded px-3 py-2 text-sm text-[#f0f1e6] placeholder:text-[#a8cebc]/40 focus:outline-none focus:border-[#d0e5d3] font-sans"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-[11px] font-mono text-[#a8cebc] uppercase mb-1">
                Direct Email
              </label>
              <input
                id="email"
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.vance@meridian.com"
                className="w-full bg-[#133b2a] border border-[#a8cebc]/30 rounded px-3 py-2 text-sm text-[#f0f1e6] placeholder:text-[#a8cebc]/40 focus:outline-none focus:border-[#d0e5d3] font-sans"
              />
            </div>

            <div>
              <label htmlFor="projectType" className="block text-[11px] font-mono text-[#a8cebc] uppercase mb-1">
                Project Classification
              </label>
              <select
                id="projectType"
                value={formData.projectType}
                onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                className="w-full bg-[#133b2a] border border-[#a8cebc]/30 rounded px-3 py-2 text-sm text-[#f0f1e6] focus:outline-none focus:border-[#d0e5d3] font-sans"
              >
                <option value="Masterplanned Development">Masterplanned Development</option>
                <option value="High-Rise Mixed-Use">High-Rise Mixed-Use</option>
                <option value="Residential Enclave">Residential Enclave</option>
                <option value="Commercial Precinct">Commercial Precinct</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-[11px] font-mono text-[#a8cebc] uppercase mb-1">
                Development Context & Timeline
              </label>
              <textarea
                id="message"
                rows={3}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe project footprint, target launch quarter, and desired fidelity..."
                className="w-full bg-[#133b2a] border border-[#a8cebc]/30 rounded px-3 py-2 text-sm text-[#f0f1e6] placeholder:text-[#a8cebc]/40 focus:outline-none focus:border-[#d0e5d3] font-sans resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-mono text-[#a8cebc] hover:text-[#f0f1e6] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-full bg-[#25231b] text-[#f0f1e6] text-xs font-mono tracking-wider border border-[#444238] hover:border-[#d0e5d3] transition-all duration-200"
              >
                Transmit Brief →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
