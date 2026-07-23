import { Layout } from "../components/layout/Layout";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "What types of printing services do you offer?",
      answer: "We offer a wide variety of printing services including business cards, custom apparel (t-shirts, hoodies, caps), marketing materials (flyers, brochures, standees), and personalized corporate gifts (mugs, diaries, pens)."
    },
    {
      question: "What is the minimum order quantity (MOQ)?",
      answer: "Our minimum order quantity varies depending on the product. Some products like mugs have an MOQ of 1, while bulk items like business cards usually start at 100 pieces. You can find the specific MOQ on each product's page."
    },
    {
      question: "Can I request a sample before placing a large order?",
      answer: "Yes! We highly recommend requesting a sample for large corporate orders. Please contact our support team to arrange a sample shipment."
    },
    {
      question: "How long does shipping take?",
      answer: "Standard orders are typically processed and shipped within 3-5 business days. Bulk orders or heavily customized items might take 7-10 business days. We also offer expedited shipping options at checkout."
    },
    {
      question: "Do you offer design services?",
      answer: "While we specialize in printing your ready-to-print designs, our partner design team can assist you with basic layout adjustments and file formatting to ensure the best print quality."
    },
    {
      question: "What file formats do you accept for custom designs?",
      answer: "For the best results, we recommend submitting your designs in high-resolution vector formats such as .AI, .EPS, or .PDF. We also accept high-quality .PNG and .JPEG files (at least 300 DPI)."
    },
    {
      question: "How do I request a bulk quotation for my company?",
      answer: "You can easily request a bulk quotation by clicking the \"Request Quotation\" button on any product page, or by contacting us directly through our Contact Us section."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-gray-600">
              Have questions? We're here to help. If you don't see your question here, feel free to contact us.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <button
                  className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
                  onClick={() => toggleFAQ(index)}
                >
                  <h3 className="font-semibold text-lg text-gray-900 pr-4">{faq.question}</h3>
                  <div className="flex-shrink-0 text-purple-600">
                    {openIndex === index ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>
                
                {openIndex === index && (
                  <div className="px-6 pb-5">
                    <div className="w-full h-px bg-gray-100 mb-4"></div>
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
