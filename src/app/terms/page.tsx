import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 font-serif">
          Terms of Service
        </h1>
        <p className="text-slate-500 text-lg">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      <div className="prose prose-slate max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Agreement to Terms</h2>
          <p className="text-slate-600 leading-relaxed">
            By accessing or using Hiredeck, you agree to be bound by these Terms of Service and all applicable laws and regulations. 
            If you do not agree with any of these terms, you are prohibited from using or accessing this site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Use License</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Permission is granted to temporarily access the materials (information or software) on Hiredeck's website for personal, 
            non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Modify or copy the materials;</li>
            <li>Use the materials for any commercial purpose, or for any public display;</li>
            <li>Attempt to decompile or reverse engineer any software contained on Hiredeck's website;</li>
            <li>Remove any copyright or other proprietary notations from the materials; or</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">3. User Content & Liability</h2>
          <p className="text-slate-600 leading-relaxed">
            Hiredeck acts as a venue for employers to post job opportunities and candidates to post resumes. 
            We do not screen or censor the listings. We are not involved in the actual transaction between employers and candidates. 
            As a result, we have no control over the quality, safety, or legality of the jobs or resumes posted, the truth or accuracy of the listings, 
            or the ability of employers to offer job opportunities to candidates.
          </p>
          <p className="text-slate-600 leading-relaxed mt-4 font-semibold">
            You assume all risks associated with dealing with other users with whom you come in contact through the platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Acceptable Use Policy</h2>
          <p className="text-slate-600 leading-relaxed">
            You agree not to use the platform to:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-slate-600">
            <li>Post any inaccurate, misleading, or fraudulent information.</li>
            <li>Post jobs that require the candidate to pay a fee or participate in multi-level marketing (MLM).</li>
            <li>Post content that is discriminatory, harassing, defamatory, or otherwise objectionable.</li>
            <li>Use automated systems (bots, spiders) to scrape data from the platform.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Account Termination</h2>
          <p className="text-slate-600 leading-relaxed">
            We reserve the right to suspend or terminate your account and your access to the platform immediately, 
            without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Disclaimer</h2>
          <p className="text-slate-600 leading-relaxed">
            The materials on Hiredeck's website are provided on an 'as is' basis. Hiredeck makes no warranties, expressed or implied, 
            and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, 
            fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section className="pt-8 mt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            If you have any questions about these Terms, please contact us at <a href="mailto:legal@hiredeck.com" className="text-blue-600 hover:underline">legal@hiredeck.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
