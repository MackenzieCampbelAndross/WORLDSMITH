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
    company: "",
    email: "",
    projectType: "Masterplanned Development",
    projectStage: "Pre-construction / Planning",
    availableAssets: "Architectural CAD / BIM / Renders",
    message: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 3200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-md animate-fadeIn font-body overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#184834] border border-[#a8cebc]/30 rounded-lg p-6 sm:p-8 text-[#f0f1e6] shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 text-xs font-medium text-[#a8cebc] hover:text-[#f0f1e6] transition-colors p-1"
        >
          [ESC] ✕
        </button>

        <div className="mb-6">
          <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] uppercase text-[#a8cebc] block mb-1">
            Initiate Engagement
          </span>
          <h2 id="contact-heading" className="text-2xl sm:text-3xl font-display font-bold text-[#f0f1e6] tracking-tight">
            Architectural Project Inquiry
          </h2>
          <p className="text-xs text-[#a8cebc]/85 mt-1 font-normal leading-relaxed">
            Connect with our spatial design studio to prototype an interactive world for your upcoming development.
          </p>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#d0e5d3]/20 border border-[#d0e5d3] mx-auto flex items-center justify-center text-[#d0e5d3] font-semibold text-sm">
              ✓
            </div>
            <p className="font-display font-semibold text-xl text-[#f0f1e6]">Brief Received</p>
            <p className="text-xs font-medium text-[#a8cebc] max-w-md mx-auto leading-relaxed">
              Demonstration transmission logged locally. Direct CRM and backend notification pipelines are currently in staging. A studio director will connect within 24 hours.
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 rounded bg-[#133b2a] text-[10px] uppercase tracking-widest text-[#a8cebc]">
                Demonstration Mode Active
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-[11px] font-semibold text-[#a8cebc] uppercase mb-1">
                  Name *
                </label>
                <input
                  id="name"
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Eleanor Vance"
                  className="w-full bg-[#133b2a] border border-[#a8cebc]/30 rounded px-3 py-2 text-xs sm:text-sm text-[#f0f1e6] placeholder:text-[#a8cebc]/40 focus:outline-none focus:border-[#d0e5d3] font-body"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-[11px] font-semibold text-[#a8cebc] uppercase mb-1">
                  Company / Development *
                </label>
                <input
                  id="company"
                  required
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Meridian Capital"
                  className="w-full bg-[#133b2a] border border-[#a8cebc]/30 rounded px-3 py-2 text-xs sm:text-sm text-[#f0f1e6] placeholder:text-[#a8cebc]/40 focus:outline-none focus:border-[#d0e5d3] font-body"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-[11px] font-semibold text-[#a8cebc] uppercase mb-1">
                Direct Email *
              </label>
              <input
                id="email"
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.vance@meridian.com"
                className="w-full bg-[#133b2a] border border-[#a8cebc]/30 rounded px-3 py-2 text-xs sm:text-sm text-[#f0f1e6] placeholder:text-[#a8cebc]/40 focus:outline-none focus:border-[#d0e5d3] font-body"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="projectType" className="block text-[11px] font-semibold text-[#a8cebc] uppercase mb-1">
                  Project Classification
                </label>
                <select
                  id="projectType"
                  value={formData.projectType}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                  className="w-full bg-[#133b2a] border border-[#a8cebc]/30 rounded px-3 py-2 text-xs sm:text-sm text-[#f0f1e6] focus:outline-none focus:border-[#d0e5d3] font-body"
                >
                  <option value="Masterplanned Development">Masterplanned Development</option>
                  <option value="High-Rise Mixed-Use">High-Rise Mixed-Use</option>
                  <option value="Residential Enclave">Residential Enclave</option>
                  <option value="Civic & Commercial Core">Civic & Commercial Core</option>
                </select>
              </div>

              <div>
                <label htmlFor="projectStage" className="block text-[11px] font-semibold text-[#a8cebc] uppercase mb-1">
                  Project Stage
                </label>
                <select
                  id="projectStage"
                  value={formData.projectStage}
                  onChange={(e) => setFormData({ ...formData, projectStage: e.target.value })}
                  className="w-full bg-[#133b2a] border border-[#a8cebc]/30 rounded px-3 py-2 text-xs sm:text-sm text-[#f0f1e6] focus:outline-none focus:border-[#d0e5d3] font-body"
                >
                  <option value="Pre-construction / Planning">Pre-construction / Planning</option>
                  <option value="Architectural Design Completed">Architectural Design Completed</option>
                  <option value="Groundbreaking / Construction">Groundbreaking / Construction</option>
                  <option value="Active Marketing & Sales Launch">Active Marketing & Sales Launch</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="availableAssets" className="block text-[11px] font-semibold text-[#a8cebc] uppercase mb-1">
                Available Architectural Assets
              </label>
              <select
                id="availableAssets"
                value={formData.availableAssets}
                onChange={(e) => setFormData({ ...formData, availableAssets: e.target.value })}
                className="w-full bg-[#133b2a] border border-[#a8cebc]/30 rounded px-3 py-2 text-xs sm:text-sm text-[#f0f1e6] focus:outline-none focus:border-[#d0e5d3] font-body"
              >
                <option value="Architectural CAD / BIM / Renders">Architectural CAD / BIM / Renders</option>
                <option value="2D Floorplans & Static Renderings">2D Floorplans & Static Renderings</option>
                <option value="Masterplan Blueprints Only">Masterplan Blueprints Only</option>
                <option value="Concept Stage / Preliminary Drawings">Concept Stage / Preliminary Drawings</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-[11px] font-semibold text-[#a8cebc] uppercase mb-1">
                Development Context & Timeline (Optional)
              </label>
              <textarea
                id="message"
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe the site footprint, target sales launch quarter, and preferred interaction scope..."
                className="w-full bg-[#133b2a] border border-[#a8cebc]/30 rounded px-3 py-2 text-xs sm:text-sm text-[#f0f1e6] placeholder:text-[#a8cebc]/40 focus:outline-none focus:border-[#d0e5d3] font-body resize-none"
              />
            </div>

            <div className="pt-3 border-t border-[#a8cebc]/20 flex items-center justify-between">
              <span className="text-[10px] text-[#a8cebc]/70">
                Direct studio consultation
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-[#a8cebc] hover:text-[#f0f1e6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#25231b] text-[#f0f1e6] text-xs font-semibold tracking-wider border border-[#444238] hover:border-[#d0e5d3] hover:bg-[#1a1813] transition-all duration-200 active:scale-95 shadow-sm"
                >
                  Submit Inquiry →
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
