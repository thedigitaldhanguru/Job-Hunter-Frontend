import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 font-serif">
          Privacy Policy
        </h1>
        <p className="text-slate-500 text-lg">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      <div className="prose prose-slate max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introduction</h2>
          <p className="text-slate-600 leading-relaxed">
            Welcome to Hiredeck. We respect your privacy and are committed to protecting your personal data. 
            This privacy policy will inform you as to how we look after your personal data when you visit our website 
            and tell you about your privacy rights and how the law protects you.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">2. The Data We Collect About You</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Personal data, or personal information, means any information about an individual from which that person can be identified.
            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier, and profile picture.</li>
            <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
            <li><strong>Professional Data</strong> includes your resume, employment history, education, and skills.</li>
            <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">3. How We Use Your Personal Data</h2>
          <p className="text-slate-600 leading-relaxed">
            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-slate-600">
            <li>To register you as a new user.</li>
            <li>To connect you with potential employers or candidates.</li>
            <li>To manage our relationship with you.</li>
            <li>To improve our website, products/services, marketing or customer relationships.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data Security</h2>
          <p className="text-slate-600 leading-relaxed">
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
            used or accessed in an unauthorised way, altered or disclosed. Your passwords are cryptographically hashed, and 
            we use industry-standard database providers to securely store your information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Third-Party Links</h2>
          <p className="text-slate-600 leading-relaxed">
            This website may include links to third-party websites, plug-ins and applications (such as Google Authentication). 
            Clicking on those links or enabling those connections may allow third parties to collect or share data about you. 
            We do not control these third-party websites and are not responsible for their privacy statements.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Your Legal Rights</h2>
          <p className="text-slate-600 leading-relaxed">
            Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-slate-600">
            <li>Request access to your personal data.</li>
            <li>Request correction of your personal data.</li>
            <li>Request erasure of your personal data.</li>
            <li>Object to processing of your personal data.</li>
          </ul>
        </section>

        <section className="pt-8 mt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            If you have any questions about this privacy policy, please contact us at <a href="mailto:privacy@hiredeck.com" className="text-blue-600 hover:underline">privacy@hiredeck.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
