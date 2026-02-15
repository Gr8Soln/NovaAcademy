import {
  Github,
  Linkedin,
  Twitter,
} from "lucide-react";

import { LogoWithName } from "../ui";
import { displayDescription } from "@/lib/constant";

const Footer = () => {
  return (
    <footer className="bg-primary-900 text-neutral-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <LogoWithName isWhite />
            <p className="text-sm text-neutral-400 max-w-xs mb-4">
              {displayDescription}
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-sans text-sm font-semibold text-white uppercase tracking-wide mb-4">
              Product
            </h4>
            <ul className="space-y-2.5">
              {["Features", "Pricing", "Leaderboard", "API"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-sans text-sm font-semibold text-white uppercase tracking-wide mb-4">
              Resources
            </h4>
            <ul className="space-y-2.5">
              {["Blog", "Help Center", "FAQ", "Community"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-sans text-sm font-semibold text-white uppercase tracking-wide mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              {["Terms of Service", "Privacy Policy", "Cookie Policy"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-neutral-400 hover:text-white transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-primary-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} Gr8Academy. All rights reserved.
          </p>
          <p className="text-sm text-neutral-500">
            Made with 🧠 for students everywhere
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
