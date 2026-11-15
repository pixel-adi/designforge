import { Link } from "wouter";
import { ArrowLeft, FileText, Globe, Calendar, Mail, Phone, Lock, ChevronRight } from "lucide-react";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

const sections = [
  { id: "section-1", title: "1. Introduction and Acceptance of Terms" },
  { id: "section-2", title: "2. Scope of Educational and Mentorship Services" },
  { id: "section-3", title: "3. Eligibility, Registration and Account Security" },
  { id: "section-4", title: "4. Academic Guidance Disclaimer & Outcome Neutrality" },
  { id: "section-5", title: "5. Platform Code of Conduct & Academic Integrity" },
  { id: "section-6", title: "6. Intellectual Property Rights" },
  { id: "section-7", title: "7. Student Submissions and Creative Work" },
  { id: "section-8", title: "8. Program Enrolment, Fees and Payments" },
  { id: "section-9", title: "9. Cancellation and Refund Policy" },
  { id: "section-10", title: "10. Mentorship Sessions and Community Spaces" },
  { id: "section-11", title: "11. Third-Party Services and External Resources" },
  { id: "section-12", title: "12. Disclaimers of Warranties" },
  { id: "section-13", title: "13. Limitation of Liability" },
  { id: "section-14", title: "14. Indemnification" },
  { id: "section-15", title: "15. Account Suspension and Termination" },
  { id: "section-16", title: "16. Modifications to Terms and Conditions" },
  { id: "section-17", title: "17. Grievance Redressal and Contact Information" },
  { id: "section-18", title: "18. Governing Law and Dispute Resolution" },
];

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar />

      <main className="flex-grow pt-28 md:pt-36 pb-24 px-4 sm:px-6 animate-section">
        <div className="max-w-4xl mx-auto">
          {/* Back Navigation */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-primary transition-colors mb-8 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>

          {/* Header Banner */}
          <div className="mb-12 border-b border-black/10 pb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-4">
              <FileText className="w-3.5 h-3.5" />
              <span>Terms of Service & Student Agreement</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading text-foreground mb-4 tracking-tight">
              Terms & Conditions
            </h1>
            <p className="text-xl text-foreground font-medium mb-3">
              Designforge
            </p>
            <p className="text-sm text-foreground/60 mb-6">
              Formerly known as Whitespace Design Foundation
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-black/5 text-sm text-foreground/70">
              <div>
                <span className="block text-xs uppercase font-semibold text-foreground/40 tracking-wider mb-1">Official Website</span>
                <a href="https://designforge.co.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                  https://designforge.co.in
                </a>
              </div>
              <div>
                <span className="block text-xs uppercase font-semibold text-foreground/40 tracking-wider mb-1">Effective Date</span>
                <span className="font-medium text-foreground">1 January 2025</span>
              </div>
              <div>
                <span className="block text-xs uppercase font-semibold text-foreground/40 tracking-wider mb-1">Last Updated</span>
                <span className="font-medium text-foreground">1 May 2026</span>
              </div>
            </div>

            <div className="w-20 h-1 bg-primary rounded-full mt-8"></div>
          </div>

          {/* Table of Contents Box */}
          <div className="p-6 md:p-8 rounded-2xl bg-white border border-black/5 shadow-sm mb-12">
            <h2 className="text-lg font-heading text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Table of Contents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors py-1 hover:translate-x-0.5"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{s.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Terms Sections */}
          <div className="space-y-12 text-foreground/85 leading-relaxed text-base md:text-lg">

            {/* Section 1 */}
            <section id="section-1" className="scroll-mt-28">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                1. Introduction and Acceptance of Terms
              </h2>
              <p className="mb-4">
                Designforge, formerly known as Whitespace Design Foundation ("Designforge", "we", "us", or "our"), is an educational and mentorship platform dedicated to making design education, creative learning, and professional guidance accessible. Designforge operates the website <a href="https://designforge.co.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">https://designforge.co.in</a>, the candidate assessment portal, preparatory curriculum, and associated digital services.
              </p>
              <p className="mb-4">
                These Terms and Conditions ("Terms") constitute a legally binding agreement between you ("User", "Student", "Candidate", or "You") and Designforge governing your access to and use of our website, learning portal, question banks, simulated mock examinations, diagnostic trackers, subjective evaluation rubrics, live sessions, workshops, and mentorship batches.
              </p>
              <p>
                By accessing our website, creating an account, participating in workshops, or enrolling in any program, you acknowledge that you have read, understood, and agreed to be bound by these Terms and our Privacy Policy. Where parental or guardian consent is legally required, your parent or guardian accepts these Terms on your behalf.
              </p>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                2. Scope of Educational and Mentorship Services
              </h2>
              <p className="mb-4">
                Designforge provides specialized pedagogical resources, curriculum frameworks, mock tests, and mentor guidance for students preparing for design competitive examinations, including the National Institute of Design Design Aptitude Test (NID DAT), Undergraduate Common Entrance Examination for Design (UCEED), Common Entrance Examination for Design (CEED), and allied creative entrance tests.
              </p>
              <p className="mb-4">
                Our Services encompass digital test delivery, automated objective scoring, mentor-led subjective portfolio and drawing critiques, diagnostic analytics, peer community interaction, and intensive cohort programs such as the Focus Batch.
              </p>
              <p>
                Designforge reserves the right to modify, enhance, update, or discontinue any aspect of its learning tools, question banks, or curriculum to align with examination pattern evolutions and pedagogical standards.
              </p>
            </section>

            {/* Section 3 */}
            <section id="section-3" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                3. Eligibility, Registration and Account Security
              </h2>
              <p className="mb-4">
                To access authenticated portal features, test series, and analytical reports, candidates must register by providing accurate, current, and complete personal information, including their real name, contact number, and email address.
              </p>
              <p className="mb-4">
                <strong>Minors & Parental Supervision:</strong> If you are under 18 years of age, you represent that your parent or lawful guardian has reviewed and consented to your registration and participation in Designforge educational programs.
              </p>
              <p className="mb-4">
                <strong>Account Confidentiality:</strong> Your account is personal, individual, and strictly non-transferable. You must not disclose, share, or transfer your login credentials to any other person. You are entirely responsible for maintaining the confidentiality of your credentials and for all activities carried out through your account.
              </p>
              <p>
                Designforge reserves the right to suspend or terminate accounts found to be using fraudulent details, shared access, or unauthorized automated logins.
              </p>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                4. Academic Guidance Disclaimer & Outcome Neutrality
              </h2>
              <p className="mb-4 font-semibold text-primary">
                Designforge provides structured guidance, rigorous practice simulations, and diagnostic feedback; we do not guarantee exam results, ranks, marks, or admission.
              </p>
              <p className="mb-4">
                Admission into prestigious institutions such as the National Institute of Design (NID), Indian Institutes of Technology (IITs), or any participating college depends solely upon the candidate's personal aptitude, dedication, consistent practice, and actual performance on examination day as evaluated by official examination authorities.
              </p>
              <p className="mb-4">
                Designforge is an independent mentorship initiative. We are not affiliated with, endorsed by, or sponsored by the National Institute of Design, IIT Bombay, or any official government examination authority.
              </p>
              <p>
                Estimated marks, percentile predictions, and leaderboard standings provided on our platform are diagnostic indicators intended to identify strengths and weaknesses; they must not be interpreted as official scorecards.
              </p>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                5. Platform Code of Conduct & Academic Integrity
              </h2>
              <p className="mb-4">
                Designforge fosters a community grounded in creativity, empathy, mutual respect, and academic honesty. By using the platform, you agree to adhere to the highest standards of integrity.
              </p>
              <p className="mb-4 font-semibold text-foreground">You expressly agree that you will not:</p>
              <ul className="list-disc pl-6 space-y-3 mb-6">
                <li>Copy, record, screenshot, download, rip, or redistribute test questions, subjective briefs, evaluation rubrics, or video lectures without prior written consent.</li>
                <li>Attempt to probe, reverse engineer, decompile, scrape, or disrupt the student portal, API endpoints, or database structures.</li>
                <li>Engage in harassment, abusive communication, defamatory remarks, or disruptive conduct toward mentors, evaluators, or fellow aspirants in live sessions or community groups.</li>
                <li>Manipulate test timers, submit fraudulent or plagiarized artwork, or inject scripts to alter leaderboard rankings or scoring mechanisms.</li>
                <li>Use automated bots, crawlers, or scrapers to access or extract content from the website or portal.</li>
              </ul>
              <p>
                Any breach of academic integrity or platform rules will lead to immediate account termination, forfeiture of fees, and potential legal action where intellectual property infringement has occurred.
              </p>
            </section>

            {/* Section 6 */}
            <section id="section-6" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                6. Intellectual Property Rights
              </h2>
              <p className="mb-4">
                All contents, materials, software, and intellectual properties appearing on or made accessible through Designforge—including but not limited to curricula, question papers, diagnostic frameworks, error ledgers, test engines, user interface design, logos, brand elements, and written materials—are the exclusive intellectual property of Designforge or its licensors.
              </p>
              <p className="mb-4">
                You are granted a revocable, limited, non-transferable, and non-exclusive personal license to view and utilize the materials solely for your own individual, non-commercial exam preparation.
              </p>
              <p>
                Commercial reproduction, unauthorized re-publishing, distribution in Telegram/WhatsApp groups, or resale of Designforge materials constitutes copyright infringement and will be pursued under the Indian Copyright Act, 1957.
              </p>
            </section>

            {/* Section 7 */}
            <section id="section-7" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                7. Student Submissions and Creative Work
              </h2>
              <p className="mb-4">
                During test attempts, assignments, and portfolio sessions, students create original drawings, sketches, written essays, and design concepts.
              </p>
              <p className="mb-4 font-semibold text-foreground">
                <strong>Student Ownership:</strong> You retain complete ownership and intellectual property rights in your original student submissions and creative portfolio works.
              </p>
              <p className="mb-4">
                <strong>Evaluation License:</strong> By submitting academic work to Designforge, you grant Designforge a royalty-free, non-exclusive license to reproduce internally, inspect, annotate, and evaluate the submission for educational feedback and administrative purposes.
              </p>
              <p>
                Designforge will not publicly display or publish your identifiable artwork for promotional campaigns, brochures, or social media testimonials without obtaining explicit consent from you or your legal guardian.
              </p>
            </section>

            {/* Section 8 */}
            <section id="section-8" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                8. Program Enrolment, Fees and Payments
              </h2>
              <p className="mb-4">
                Enrolment in paid batches (such as Focus Batch), test packs, subjective evaluation passes, and masterclasses is subject to timely payment of specified fees. All monetary amounts are quoted in Indian Rupees (INR) unless indicated otherwise.
              </p>
              <p className="mb-4">
                Payments are processed through secure external payment gateways. Designforge does not store debit/credit card numbers or CVVs. Enrolment is confirmed only once full payment has been received and verified.
              </p>
              <p>
                Designforge reserves the right to revise pricing for future batches and offerings without retrospective application to existing paid enrolments.
              </p>
            </section>

            {/* Section 9 */}
            <section id="section-9" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                9. Cancellation and Refund Policy
              </h2>
              <p className="mb-4">
                Designforge provides high-touch mentorship, personalized evaluations, and instantaneous access to proprietary intellectual assets.
              </p>
              <p className="mb-4">
                <strong>Digital Assessment & Test Packs:</strong> Access to digital question banks, test engines, and performance analytics is activated immediately upon purchase. Consequently, test packs and self-study subscriptions are non-refundable once activated.
              </p>
              <p className="mb-4">
                <strong>Live Mentorship Cohorts:</strong> Cancellation requests submitted in writing prior to the formal commencement of a batch may be refunded subject to deduction of administrative and payment gateway processing charges. Once batch sessions have begun or evaluation sheets have been reviewed, fees are non-refundable.
              </p>
              <p>
                In case of duplicate transactions or proven technical billing errors, the excess amount will be refunded upon verification.
              </p>
            </section>

            {/* Section 10 */}
            <section id="section-10" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                10. Mentorship Sessions and Community Spaces
              </h2>
              <p className="mb-4">
                Interactive mentorship calls, group critique rooms, and dedicated WhatsApp/Discord study cohorts are shared educational environments.
              </p>
              <p className="mb-4">
                Participants must respect session schedules, mentor guidelines, and peer privacy. Sharing unsolicited commercial promotions, advertising third-party coaching, or circulating irrelevant content is prohibited.
              </p>
              <p>
                Designforge reserves the right to remove any participant from live sessions or community cohorts who behaves disrespectfully or violates community etiquette.
              </p>
            </section>

            {/* Section 11 */}
            <section id="section-11" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                11. Third-Party Services and External Resources
              </h2>
              <p className="mb-4">
                Our Services may integrate with or link to third-party services, including cloud hosting, authentication systems (e.g. Supabase, Google OAuth), video streaming, payment processors, and messaging platforms.
              </p>
              <p className="mb-4">
                Designforge is not responsible for the performance, uptime, security practices, or availability of external third-party infrastructure beyond our reasonable control.
              </p>
              <p>
                Any reference or hyperlink to external exam portals (e.g. admissions.nid.edu or uceed.iitb.ac.in) is provided strictly for academic convenience.
              </p>
            </section>

            {/* Section 12 */}
            <section id="section-12" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                12. Disclaimers of Warranties
              </h2>
              <p className="mb-4">
                The Services are provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied.
              </p>
              <p className="mb-4">
                Designforge does not guarantee that access to the website or student portal will be completely uninterrupted, timely, or error-free at every moment, or that defects will be corrected immediately during scheduled maintenance windows.
              </p>
              <p>
                While our academic team exercises immense care in compiling questions and model solutions, we make no representation that practice test questions will appear verbatim in actual entrance exams.
              </p>
            </section>

            {/* Section 13 */}
            <section id="section-13" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                13. Limitation of Liability
              </h2>
              <p className="mb-4">
                To the fullest extent permitted under applicable law, Designforge, its founders, mentors, evaluators, and staff shall not be liable for any indirect, incidental, punitive, or consequential damages arising from your use of or inability to use the platform.
              </p>
              <p>
                Under all circumstances, Designforge's total aggregate liability arising out of or related to these Terms or the Services shall be limited strictly to the actual monetary amount paid by you to Designforge for the specific service or subscription in question.
              </p>
            </section>

            {/* Section 14 */}
            <section id="section-14" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                14. Indemnification
              </h2>
              <p>
                You agree to defend, indemnify, and hold harmless Designforge, its directors, mentors, and affiliates from and against any claims, losses, liabilities, damages, and legal costs resulting from your breach of these Terms, unauthorized redistribution of course materials, or violation of any third-party intellectual property rights.
              </p>
            </section>

            {/* Section 15 */}
            <section id="section-15" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                15. Account Suspension and Termination
              </h2>
              <p className="mb-4">
                Designforge reserves the right, at its sole discretion, to suspend, deactivate, or permanently terminate your account without notice if we have reasonable grounds to believe that you have violated these Terms, engaged in piracy, or attempted to compromise the security of the platform.
              </p>
              <p>
                Upon termination, your right to access the student portal and evaluation services will cease immediately.
              </p>
            </section>

            {/* Section 16 */}
            <section id="section-16" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                16. Modifications to Terms and Conditions
              </h2>
              <p className="mb-4">
                Designforge reserves the right to amend these Terms periodically to reflect changes in our pedagogical offerings, operational practices, or applicable statutory laws.
              </p>
              <p>
                Revised Terms will be published on this page with an updated "Last Updated" date. Continued access or use of our website or learning portal following such changes signifies your acceptance of the revised Terms.
              </p>
            </section>

            {/* Section 17 */}
            <section id="section-17" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                17. Grievance Redressal and Contact Information
              </h2>
              <p className="mb-6">
                For questions, clarifications, legal inquiries, or grievance redressal concerning these Terms, please contact:
              </p>

              <div className="p-6 md:p-8 rounded-2xl bg-white border border-black/5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-xl font-heading text-foreground">Designforge</h3>
                  <p className="text-sm text-foreground/60 m-0">Formerly Whitespace Design Foundation</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs uppercase font-semibold text-foreground/50 tracking-wider">Website</p>
                      <a href="https://designforge.co.in" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors font-medium">
                        https://designforge.co.in
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs uppercase font-semibold text-foreground/50 tracking-wider">Phone</p>
                      <a href="tel:+918174904145" className="text-foreground hover:text-primary transition-colors font-medium">
                        +91 81749 04145
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs uppercase font-semibold text-foreground/50 tracking-wider">Official Inquiries & Support</p>
                      <a href="mailto:designforge05@gmail.com" className="text-foreground hover:text-primary transition-colors font-medium">
                        designforge05@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs uppercase font-semibold text-foreground/50 tracking-wider">Legal & Compliance</p>
                      <p className="text-foreground font-medium m-0">
                        Designforge Compliance Officer
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 18 */}
            <section id="section-18" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                18. Governing Law and Dispute Resolution
              </h2>
              <p className="mb-4">
                These Terms and Conditions shall be governed by, interpreted, and construed in accordance with the substantive laws of India, without regard to principles of conflicts of law.
              </p>
              <p>
                Any dispute, claim, or controversy arising out of or relating to these Terms or the breach, termination, or invalidity thereof shall first be addressed through good-faith amicable discussion. In the event that a resolution cannot be reached, the dispute shall be subject to the exclusive jurisdiction of the competent courts in India.
              </p>
            </section>

            {/* Footer Tagline */}
            <div className="mt-16 pt-8 border-t border-black/10 text-center">
              <p className="text-sm font-semibold text-foreground/80 mb-1">
                © 2026 Designforge. All rights reserved.
              </p>
              <p className="text-sm italic text-primary font-heading">
                Design your journey. Define your future.
              </p>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
