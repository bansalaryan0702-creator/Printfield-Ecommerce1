import { Layout } from "../components/layout/Layout";

export function Privacy() {
  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-sm text-gray-500 mb-8 border-b pb-8 border-gray-100">
              Last Updated: June 10, 2026
            </p>

            <div className="space-y-8 text-gray-700 leading-relaxed">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
                <p className="mb-3">
                  At Printfield, we collect information to provide better services to our users. The types of personal information we may collect include:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Contact Information:</strong> Name, email address, phone number, and physical mailing/shipping address.</li>
                  <li><strong>Account Information:</strong> Passwords, purchase history, and user preferences.</li>
                  <li><strong>Custom Design Assets:</strong> Images, logos, and files you upload to be printed on your customized products.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
                <p className="mb-3">
                  We use the information we collect for the following purposes:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>To process and fulfill your orders, including communicating with you about your order status.</li>
                  <li>To provide and maintain our services.</li>
                  <li>To improve, personalize, and expand our website and product offerings.</li>
                  <li>To respond to your inquiries, customer service requests, and technical support needs.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Sharing Your Information</h2>
                <p>
                  We do not sell, trade, or rent your personal identification information to others. We may share generic aggregated 
                  demographic information not linked to any personal identification information regarding visitors and users with our 
                  business partners, trusted affiliates, and advertisers for the purposes outlined above. We may use third-party service 
                  providers to help us operate our business and the Site or administer activities on our behalf, such as sending out 
                  newsletters or surveys, or processing shipping and billing.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
                <p>
                  We adopt appropriate data collection, storage, and processing practices and security measures to protect against 
                  unauthorized access, alteration, disclosure, or destruction of your personal information, username, password, 
                  transaction information, and data stored on our Site.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. User Consent</h2>
                <p>
                  By using our Site, you consent to our website's privacy policy. If we decide to change our privacy policy, we will 
                  post those changes on this page.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this site, 
                  please contact us at <strong>support@printfield.com</strong>.
                </p>
              </section>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
