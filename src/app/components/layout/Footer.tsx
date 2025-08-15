import Link from 'next/link';
// Placeholder for social icons - consider using a library like react-icons
const FacebookIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" /></svg>;
const TwitterIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-.422.724-.665 1.56-.665 2.452 0 1.606.816 3.021 2.053 3.847-.76-.024-1.474-.234-2.102-.577v.073c0 2.244 1.595 4.113 3.712 4.542-.387.105-.796.16-.976.16-.299 0-.589-.029-.878-.084.588 1.835 2.296 3.171 4.321 3.207-1.581 1.239-3.575 1.975-5.748 1.975-.372 0-.74-.022-1.103-.065 2.042 1.319 4.471 2.088 7.087 2.088 8.49 0 13.138-7.039 13.138-13.138 0-.201 0-.402-.013-.602.901-.65 1.683-1.465 2.301-2.387z" /></svg>;
const LinkedInIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" /></svg>;

export default function Footer() {
  return (
    <footer className="bg-[var(--primary-blue)] text-gray-300 py-12 md:py-16 w-full">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Quick Links */}
          <div>
            <h5 className="mb-4 text-lg font-semibold text-white">Quick Links</h5>
            <ul className="space-y-2">
              <li><Link href="/about" className="hover:text-[var(--accent-gold)] transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-[var(--accent-gold)] transition-colors">Contact Us</Link></li>
              <li><Link href="/pricing" className="hover:text-[var(--accent-gold)] transition-colors">Pricing</Link></li>
              <li><Link href="/faq" className="hover:text-[var(--accent-gold)] transition-colors">FAQ</Link></li>
              <li><Link href="/terms" className="hover:text-[var(--accent-gold)] transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h5 className="mb-4 text-lg font-semibold text-white">Contact Info</h5>
            <p className="mb-2">65-1, Jalan SP 1, Taman Semabok Perdana, 75050 Melaka. Malaysia</p>
            <p className="mb-2">Phone: +60 113 177 0681</p>
            <p>Email: <a href="mailto:info@afroasiaconnect.com" className="hover:text-[var(--accent-gold)] transition-colors">info@afroasiaconnect.com</a></p>
          </div>

          {/* Socials */}
          <div>
            <h5 className="mb-4 text-lg font-semibold text-white">Follow Us</h5>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-[var(--accent-gold)] transition-colors"><FacebookIcon /></a>
              <a href="#" className="hover:text-[var(--accent-gold)] transition-colors"><TwitterIcon /></a>
              <a href="#" className="hover:text-[var(--accent-gold)] transition-colors"><LinkedInIcon /></a>
            </div>
          </div>

          {/* Mini Map Placeholder - This would require a more complex implementation or an image */}
          <div>
            <h5 className="mb-4 text-lg font-semibold text-white">Our Network</h5>
            <div className="p-2 text-center text-gray-400 bg-gray-700 rounded-md h-36">
              [Mini Map of Asia & Africa Placeholder]
            </div>
          </div>
        </div>
        <div className="pt-8 mt-8 text-center border-t border-gray-700">
          <p>&copy; {new Date().getFullYear()} AfroAsiaConnect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
