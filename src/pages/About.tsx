import { Layout } from "../components/layout/Layout";
import { Printer, Target, Shield, HeartHandshake, Zap, Award } from "lucide-react";
import { Link } from "react-router-dom";

export function About() {
  return (
    <Layout>
      <div className="bg-white">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 bg-gray-50 overflow-hidden">
          <div className="absolute inset-0 bg-purple-900/5 z-0" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              About <span className="text-purple-600">Printfield</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We are a premier destination for high-quality custom printing, personalized corporate gifts, and digital solutions. Our mission is to bring your creative ideas and brand identity to life with unmatched precision and vibrant quality.
            </p>
          </div>
        </section>

        {/* Our Story / Mission */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <img referrerPolicy="no-referrer"
                  src="https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Printing Process"
                  className="rounded-2xl shadow-xl border border-gray-100"
                />
              </div>
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-semibold tracking-wide uppercase">
                  <Target className="w-4 h-4" /> Our Mission
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Setting the Standard for Custom Prints
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Since our inception, we have been committed to empowering businesses and individuals through exceptional print quality. Whether you're ordering custom business cards, bulk corporate apparel, or personalized gifts, we handle every project with care.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Located in the heart of Whitefield, Bengaluru, we blend state-of-the-art printing technology with a deep passion for craftsmanship.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
              <p className="text-gray-600 text-lg">
                We go beyond just putting ink on paper. We are your dedicated partners in building and presenting your brand.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Printer className="w-8 h-8 text-purple-600" />,
                  title: "Premium Print Quality",
                  description: "We use cutting-edge printers and top-tier materials to ensure every product looks sharp and professional."
                },
                {
                  icon: <Zap className="w-8 h-8 text-purple-600" />,
                  title: "Fast Turnaround",
                  description: "We understand deadlines. Our efficient workflow ensures your orders are processed and delivered on time."
                },
                {
                  icon: <Shield className="w-8 h-8 text-purple-600" />,
                  title: "Satisfaction Guarantee",
                  description: "Your trust is our priority. If you're not 100% satisfied with your order, we'll work with you to make it right."
                },
                {
                  icon: <HeartHandshake className="w-8 h-8 text-purple-600" />,
                  title: "Dedicated Support",
                  description: "Our friendly team is always ready to guide you through materials, design choices, and bulk orders."
                },
                {
                  icon: <Target className="w-8 h-8 text-purple-600" />,
                  title: "Low Minimums",
                  description: "Whether you need 10 items for a small team or 10,000 for a massive campaign, we adapt to your needs."
                },
                {
                  icon: <Award className="w-8 h-8 text-purple-600" />,
                  title: "Eco-Conscious Options",
                  description: "We continuously strive to offer sustainable materials to help reduce the environmental impact of your branding."
                }
              ].map((feature, idx) => (
                <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Ready to Upgrade Your Branding?
            </h2>
            <p className="text-lg text-gray-600 mb-10">
              Browse our vast collection of customizable products or get in touch with our team for bulk corporate orders and specialized quotations.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/categories"
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Browse Products
              </Link>
              <Link
                to="/"
                onClick={() => {
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
