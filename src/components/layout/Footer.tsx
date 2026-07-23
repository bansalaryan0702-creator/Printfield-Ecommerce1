import { Link } from "react-router-dom";
import { Printer, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand & About */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
              <img referrerPolicy="no-referrer" src="/logo.png" alt="Printfield" className="h-10 w-auto object-contain brightness-0 invert opacity-90" />
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Your one-stop destination for premium quality custom printing, personalized gifts, and digital corporate solutions.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Products</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/category/business-cards" className="hover:text-purple-400 transition-colors">Business Cards</Link></li>
              <li><Link to="/category/apparel" className="hover:text-purple-400 transition-colors">Custom T-Shirts</Link></li>
              <li><Link to="/category/marketing" className="hover:text-purple-400 transition-colors">Flyers & Brochures</Link></li>
              <li><Link to="/category/gifts" className="hover:text-purple-400 transition-colors">Corporate Gifts</Link></li>
              <li><Link to="/category/signage" className="hover:text-purple-400 transition-colors">Banners & Signboards</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-purple-400 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-purple-400 transition-colors">Contact Us</Link></li>
              <li><Link to="/faq" className="hover:text-purple-400 transition-colors">FAQ</Link></li>
              <li><Link to="/terms" className="hover:text-purple-400 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/admin" className="hover:text-purple-400 transition-colors text-purple-500">Admin Dashboard</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                <span className="text-gray-400">No 96, Mini Villa, Opp. Chaitnya Swojas, Borewell Road, Whitefield, Bengaluru Karnataka 560066</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-purple-500 shrink-0" />
                <span className="text-gray-400">+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-purple-500 shrink-0" />
                <span className="text-gray-400">support@printfield.com</span>
              </li>
            </ul>
          </div>

        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center text-gray-500">
          <p>© {new Date().getFullYear()} Printfield Digital Solutions. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
