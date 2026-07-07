"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  BookBookmark01Icon,
  ElectricPlugsIcon,
  HelpCircleIcon,
  SparklesIcon,
  ViewIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";

import { TopNavbar } from "@/components/top-navbar";
import { GuitarIcon } from "@/components/guitar-icon";

type HelpSection = {
  title: string;
  icon: typeof ViewIcon;
  description: string;
  items: string[];
};

const sections: HelpSection[] = [
  {
    title: "Wiring Library",
    icon: ViewIcon,
    description:
      "Browse and explore published guitar wiring diagrams from the community.",
    items: [
      "Search diagrams by pickup configuration, switch type, or keyword",
      "Filter by verified templates or sort by popularity",
      "Click any diagram to view full detail with interactive preview",
      "Love or save diagrams to your collection",
    ],
  },
  {
    title: "Wiring Builder",
    icon: Wrench01Icon,
    description:
      "Create custom guitar wiring diagrams with a visual drag-and-drop editor.",
    items: [
      "Drag components (pickups, pots, switches) onto the canvas",
      "Connect component pins by clicking connection points",
      "Configure wire colors and types for each connection",
      "Save your setup as a draft or publish to the community",
      "Export your diagram as an image for reference",
    ],
  },
  {
    title: "Component Studio",
    icon: ElectricPlugsIcon,
    description:
      "Design and publish custom component assets for use in the Wiring Builder.",
    items: [
      "Create SVG-based component visuals with the built-in editor",
      "Define connection points (anchor points) on your component",
      "Preview how your component looks at different scales",
      "Publish components to make them available in the builder",
    ],
  },
  {
    title: "AI Import",
    icon: SparklesIcon,
    description:
      "Import existing wiring diagrams using AI-powered image recognition.",
    items: [
      "Upload a photo or scan of a wiring diagram",
      "AI identifies components and connections automatically",
      "Review and adjust the detected layout",
      "Save the imported diagram to your designs",
    ],
  },
  {
    title: "My Designs",
    icon: BookBookmark01Icon,
    description: "Manage all your wiring diagrams and component drafts in one place.",
    items: [
      "View all your saved setups and published templates",
      "Edit or delete existing designs",
      "Track love count and views on your published work",
      "Unpublish templates if needed",
    ],
  },
];

const faqs = [
  {
    question: "How do I publish a wiring diagram?",
    answer:
      "Open your saved setup in the Wiring Builder, then click the Publish button. Fill in the template name, description, and select the pickup configuration and switch type. Once published, it will appear in the Wiring Library.",
  },
  {
    question: "Can I edit a published diagram?",
    answer:
      "Yes. Go to My Designs, find the published template, and click Edit. Changes will update the published version after you save.",
  },
  {
    question: "What pickup configurations are supported?",
    answer:
      "The system supports all common configurations including SSS, HSS, HH, HSH, SS, and single pickup setups. Custom configurations can be added by developers.",
  },
  {
    question: "How does the AI Import work?",
    answer:
      "Upload an image of a wiring diagram. The AI analyzes the image to detect components (pickups, pots, switches) and their connections. You can then review and adjust the result before saving.",
  },
  {
    question: "Can I use diagrams from the library in my own guitar?",
    answer:
      "Absolutely. All published diagrams in the Wiring Library are shared by the community for reference. Click on any diagram to see the full component list, pin connections, and switch positions.",
  },
  {
    question: "How do I save a diagram for later?",
    answer:
      "Click the bookmark icon on any diagram card in the Wiring Library. Saved diagrams appear in your Saved Setups section.",
  },
];

export function HelpContent({ hideNavbar = false }: { hideNavbar?: boolean }) {
  return (
    <div className="flex flex-1 flex-col">
      {!hideNavbar && (
        <TopNavbar
          items={[
            { label: "Help", href: "/help", icon: HelpCircleIcon, active: true },
          ]}
        />
      )}

      <div className="flex-1 px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <GuitarIcon className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Help Center</h1>
              <p className="text-sm text-muted-foreground">
                Learn how to use Guitar Wire Diagrams
              </p>
            </div>
          </div>
        </div>

        {/* Feature Sections */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <div
              key={section.title}
              className="rounded-xl border border-border/60 bg-card p-5 transition hover:border-primary/30 hover:shadow-sm"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <HugeiconsIcon
                    icon={section.icon}
                    strokeWidth={2}
                    className="size-4 text-primary"
                  />
                </div>
                <h2 className="text-sm font-semibold text-foreground">
                  {section.title}
                </h2>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                {section.description}
              </p>
              <ul className="space-y-1.5">
                {section.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-xs text-foreground/80"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div>
          <h2 className="mb-5 text-lg font-semibold text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-xl border border-border/60 bg-card p-5"
              >
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  {faq.question}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
