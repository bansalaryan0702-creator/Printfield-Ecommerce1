import { Layout } from "../components/layout/Layout";

export function Terms() {
  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 tracking-tight">
              Terms & Conditions
            </h1>
            <p className="text-sm text-gray-500 mb-8 border-b pb-8 border-gray-100">
              Last Updated: June 10, 2026
            </p>

            <div className="space-y-8 text-gray-700 leading-relaxed">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
                <p>
                  Welcome to Printfield. These Terms and Conditions govern your use of our website and services, 
                  including custom printing, personalized corporate gifts, and digital solutions. By using our website 
                  or placing an order, you agree to comply with and be bound by these terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Products and Pricing</h2>
                <p>
                  All products, features, and prices described or depicted on our website are subject to change at any time 
                  without notice. We make all reasonable efforts to accurately display the attributes of our products, 
                  including color and dimensions. However, the actual color you see may depend on your computer system, 
                  and we cannot guarantee that your device will accurately display such colors.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Custom Orders and Designs</h2>
                <p>
                  For custom orders, you are responsible for ensuring that any designs, logos, or text you provide do not 
                  infringe on any third-party intellectual property rights. By submitting a design, you grant us a 
                  non-exclusive license to use, reproduce, and print the design for the sole purpose of fulfilling your order. 
                  We reserve the right to reject any design that we consider inappropriate, offensive, or unlawful.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Order Processing and Cancellations</h2>
                <p className="mb-3">
                  Once a custom order is placed and production has begun, it cannot be canceled or modified. If you need 
                  to change your order immediately after placing it, please contact our support team as soon as possible, 
                  and we will do our best to accommodate your request if production has not commenced.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Return and Refund Policy</h2>
                <p>
                  Because our products are highly customized to your specifications, we generally do not accept returns 
                  unless the product is defective or damaged upon arrival. If you receive a defective item, please contact us 
                  within 7 days of delivery with photographic evidence, and we will arrange a replacement or refund.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Contact Information</h2>
                <p>
                  If you have any questions or concerns about these Terms and Conditions, please contact us at:<br/><br/>
                  <strong>Printfield Digital Solutions</strong><br/>
                  No 96, Mini Villa, Opp. Chaitnya Swojas, Borewell Road,<br/>
                  Whitefield, Bengaluru Karnataka 560066<br/>
                  Email: support@printfield.com<br/>
                  Phone: +91 98765 43210
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
