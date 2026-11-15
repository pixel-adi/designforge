import { Link } from "wouter";
import { ArrowLeft, FileText, Globe, Calendar, Mail, Phone, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

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
              <span>Terms & Conditions of Service</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading text-foreground mb-4 tracking-tight">
              Terms & Conditions
            </h1>
            <p className="text-lg text-foreground/80 font-medium mb-4">
              Designforge (Formerly Whitespace Design Foundation)
            </p>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-foreground/60">
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-primary" />
                <a href="https://designforge.co.in" target="_blank" rel="noopener noreferrer" className="hover:underline">
                  https://designforge.co.in
                </a>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                Effective Date: 1 January 2025
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                Last Updated: 1 May 2026
              </span>
            </div>
            <div className="w-20 h-1 bg-primary rounded-full mt-6"></div>
          </div>

          {/* Quick Notice Card */}
          <div className="p-6 md:p-8 rounded-2xl bg-white border border-black/5 shadow-sm mb-12">
            <p className="text-lg md:text-xl font-heading text-foreground mb-2">
              Welcome to Designforge
            </p>
            <p className="text-foreground/80 leading-relaxed m-0">
              Please read these Terms and Conditions carefully before accessing or using the Designforge website, learning portal, diagnostic tools, mentorship tracks, and mock examination engines. By accessing, enrolling, or participating in any Designforge offering, you agree to be legally bound by these terms.
            </p>
          </div>

          {/* Terms Sections */}
          <div className="space-y-12 text-foreground/85 leading-relaxed">

            {/* Section 1 */}
            <section id="section-1" className="scroll-mt-28">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                1. Introduction and Acceptance of Terms
              </h2>
              <p className="mb-4">
                Designforge, formerly known as Whitespace Design Foundation ("Designforge", "we", "us", or "our"), operates the website <a href="https://designforge.co.in" className="text-primary hover:underline">https://designforge.co.in</a>, the student portal, preparatory trackers, and related educational services.
              </p>
              <p className="mb-4">
                These Terms and Conditions ("Terms") govern your access to and use of our website, digital assessment portal, study materials, interactive question banks, live and recorded mentorship sessions, and offline or online workshops (collectively, the "Services").
              </p>
              <p>
                By creating an account, browsing our website, taking an assessment, or enrolling in any program, you confirm that you have read, understood, and agreed to these Terms, as well as our Privacy Policy. If you do not agree to these Terms, you must refrain from using the Services.
              </p>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                2. Scope of Educational and Mentorship Services
              </h2>
              <p className="mb-4">
                Designforge is an educational and mentorship platform specializing in design entrance preparation, creative thinking development, portfolio guidance, and academic assessment for competitive exams such as NID DAT, UCEED, CEED, and related design entrance examinations.
              </p>
              <p className="mb-4">
                Our Services include digital test engines, objective and subjective paper evaluations, diagnostic trackers, personalized feedback, peer learning spaces, and structured batches such as the Focus Batch.
              </p>
              <p>
                Designforge reserves the right to update, modify, expand, or deprecate any aspect of its learning tools, question banks, or curricula to preserve educational relevance and technical excellence.
              </p>
            </section>

            {/* Section 3 */}
            <section id="section-3" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                3. Eligibility, Registration and Account Security
              </h2>
              <p className="mb-4">
                To access the student portal and specific features, you must register for an account using authentic and accurate personal details, including your legal name, contact email, and phone number.
              </p>
              <div className="space-y-3 mb-6 bg-white/60 p-6 rounded-2xl border border-black/5">
                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0"></span>
                  <p className="m-0 text-foreground/80"><strong>Age & Parental Guidance:</strong> If you are under 18 years of age, you must use our Services under the supervision and with the explicit consent of a parent or legal guardian.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0"></span>
                  <p className="m-0 text-foreground/80"><strong>Single User License:</strong> Each account is strictly personal and non-transferable. You may not share, sell, or transfer your login credentials to any third party.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0"></span>
                  <p className="m-0 text-foreground/80"><strong>Account Safeguarding:</strong> You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.</p>
                </div>
              </div>
              <p>
                Designforge reserves the right to suspend or terminate accounts that provide fraudulent, misleading, or abusive registration details.
              </p>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                4. Academic Guidance Disclaimer & Outcome Neutrality
              </h2>
              
              <div className="my-6 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                <p className="text-lg font-heading text-primary mb-2">
                  No Guarantee of Selection, Ranks or Admissions
                </p>
                <p className="text-foreground/80 m-0 leading-relaxed">
                  Designforge provides pedagogical guidance, diagnostic evaluations, practice materials, and mentorship to nurture design aptitude. We do not guarantee, promise, or warrant admission, selection, rank, or specific scores in any entrance examination, university, or academic institution, including the National Institute of Design (NID), IITs (UCEED/CEED), or other institutes. Examination outcomes depend on the student's independent diligence, personal aptitude, and exam day performance.
                </p>
              </div>

              <p className="mb-4">
                Mock tests and estimated scores provided by the platform represent practice simulations and should be treated as diagnostic aids rather than official institutional metrics.
              </p>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                5. Platform Code of Conduct & Academic Integrity
              </h2>
              <p className="mb-4">
                Learners, aspirants, and community members are expected to conduct themselves with integrity, professionalism, and mutual respect across all platform interactions, live sessions, and community channels.
              </p>
              <p className="mb-4 font-medium text-foreground">You agree not to:</p>
              <ul className="space-y-3 mb-6 bg-white/60 p-6 rounded-2xl border border-black/5">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0"></span>
                  <span>Distribute, copy, screenshot, video-record, or extract proprietary questions, solution keys, evaluation rubrics, or video lectures without written permission.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0"></span>
                  <span>Attempt to reverse engineer, decompile, scrape, or probe the portal, backend APIs, or test engine.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0"></span>
                  <span>Engage in harassment, abusive language, discriminatory speech, or disrespectful behavior towards mentors, evaluators, or fellow learners.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0"></span>
                  <span>Manipulate leaderboard rankings, scores, or diagnostic timers using automated bots or script injections.</span>
                </li>
              </ul>
              <p>
                Violations of this code of conduct may result in immediate suspension or permanent revocation of portal access without refund.
              </p>
            </section>

            {/* Section 6 */}
            <section id="section-6" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                6. Intellectual Property Rights
              </h2>
              <p className="mb-4">
                All intellectual property rights in and to the Designforge platform—including without limitation logos, trademarks, website design, original question papers, test rubrics, proprietary evaluation methodologies, analytical dashboards, software code, and educational frameworks—are the exclusive property of Designforge or its licensors.
              </p>
              <p className="mb-4">
                You are granted a limited, personal, revocable, non-exclusive, and non-transferable license to access and view study materials strictly for your individual educational preparation.
              </p>
              <p>
                Any commercial reproduction, redistribution, public exhibition, re-hosting, or monetization of Designforge content without explicit written consent is strictly prohibited and constitutes an infringement punishable under applicable laws.
              </p>
            </section>

            {/* Section 7 */}
            <section id="section-7" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                7. Student Submissions and Creative Work
              </h2>
              <p className="mb-4">
                Students regularly submit design solutions, sketches, creative sheets, portfolio projects, and written essays for evaluation and feedback.
              </p>
              <p className="mb-4">
                <strong>Student Ownership:</strong> You retain full intellectual property ownership of your original sketches, designs, and creative works submitted to the platform.
              </p>
              <p className="mb-4">
                <strong>Evaluation License:</strong> By submitting academic work to Designforge, you grant us a non-exclusive, royalty-free license to store, review, annotate, evaluate, and display such work internally to our assigned mentors, educators, and administrators for evaluation purposes.
              </p>
              <p>
                Designforge will not publish or display your identifiable creative work for marketing, testimonials, or promotional campaigns without your prior consent.
              </p>
            </section>

            {/* Section 8 */}
            <section id="section-8" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                8. Program Enrolment, Fees and Payments
              </h2>
              <p className="mb-4">
                Fees for paid batches, mock series, evaluations, and mentorship tracks are published on our website or communicated through official registration channels. All payments must be made in Indian Rupees (INR) unless explicitly stated otherwise.
              </p>
              <p className="mb-4">
                Payments are processed via authorized third-party payment gateways. Designforge does not store your complete payment card or net banking credentials.
              </p>
              <p>
                Enrolment is confirmed only upon successful verification of payment. Designforge reserves the right to adjust pricing for future batches or offerings at its discretion.
              </p>
            </section>

            {/* Section 9 */}
            <section id="section-9" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                9. Cancellation and Refund Policy
              </h2>
              <p className="mb-4">
                Designforge provides high-quality educational content, instant digital access, and dedicated mentor hours. Due to the intellectual and customized nature of educational delivery:
              </p>
              <div className="space-y-3 mb-6 bg-white/60 p-6 rounded-2xl border border-black/5">
                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0"></span>
                  <p className="m-0 text-foreground/80"><strong>Digital Portal & Test Packs:</strong> Access to digital question banks, mock exams, and automated analytics is provisioned immediately upon purchase; hence, digital test packs and self-study modules are generally non-refundable once accessed.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0"></span>
                  <p className="m-0 text-foreground/80"><strong>Mentorship Batches:</strong> Refund requests submitted prior to batch commencement may be eligible for processing minus administrative and payment gateway processing fees. Once live batch sessions have begun or evaluated work has been returned, fees are non-refundable.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0"></span>
                  <p className="m-0 text-foreground/80"><strong>Exceptional Circumstances:</strong> Genuine grievances or technical billing discrepancies will be reviewed on a case-by-case basis by the Designforge administrative committee.</p>
                </div>
              </div>
            </section>

            {/* Section 10 */}
            <section id="section-10" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                10. Mentorship Sessions and Community Spaces
              </h2>
              <p className="mb-4">
                Mentorship cohorts, WhatsApp study groups, and interactive workshops are collaborative spaces designed to support preparation. Participants must preserve a safe, constructive, and supportive atmosphere.
              </p>
              <p className="mb-4">
                Spamming, commercial solicitation, sharing unsolicited marketing links, or harassing community members is strictly forbidden and will result in immediate removal from community channels without refund.
              </p>
              <p>
                Mentors provide guidance in their academic and advisory capacity; schedule modifications or mentor allocations may be adjusted when necessary to ensure optimal program delivery.
              </p>
            </section>

            {/* Section 11 */}
            <section id="section-11" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                11. Third-Party Services and External Resources
              </h2>
              <p className="mb-4">
                Our platform may integrate or interface with third-party software providers (such as cloud hosting, authentication systems, payment processors, video streaming platforms, or external messaging applications).
              </p>
              <p className="mb-4">
                Designforge does not assume responsibility or liability for downtime, security policies, or independent disruptions caused by third-party providers beyond our reasonable control.
              </p>
              <p>
                Links to external exam authority websites (e.g., admissions.nid.edu, uceed.iitb.ac.in) are provided for convenience only. We do not endorse or control official government or university portals.
              </p>
            </section>

            {/* Section 12 */}
            <section id="section-12" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                12. Disclaimers of Warranties
              </h2>
              <p className="mb-4">
                The Services are provided on an "as is" and "as available" basis. To the maximum extent permitted under applicable law, Designforge disclaims all warranties, express or implied, including fitness for a particular examination purpose, non-infringement, and uninterrupted system availability.
              </p>
              <p>
                While we strive for high uptime and rigorous test accuracy, we do not warrant that our servers, test timers, or software will operate completely error-free or uninterrupted during unexpected technical outages.
              </p>
            </section>

            {/* Section 13 */}
            <section id="section-13" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                13. Limitation of Liability
              </h2>
              <p className="mb-4">
                To the fullest extent permitted under Indian law, Designforge, its directors, mentors, employees, and affiliates will not be liable for any indirect, consequential, punitive, incidental, or special damages arising out of your access to or inability to use the platform.
              </p>
              <p>
                In any circumstance, our aggregate cumulative liability towards you for any claim arising out of these Terms or the Services shall not exceed the actual amount paid by you to Designforge for the specific service in dispute.
              </p>
            </section>

            {/* Section 14 */}
            <section id="section-14" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                14. Indemnification
              </h2>
              <p>
                You agree to indemnify, defend, and hold harmless Designforge, its mentors, operators, and staff from and against any claims, damages, liabilities, losses, and expenses (including reasonable legal fees) resulting from your violation of these Terms, infringement of any intellectual property rights, or misuse of the platform.
              </p>
            </section>

            {/* Section 15 */}
            <section id="section-15" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                15. Account Suspension and Termination
              </h2>
              <p className="mb-4">
                Designforge reserves the right, in its sole discretion, to suspend, disable, or terminate your account or revoke access to the Services at any time if we reasonably believe that you have breached these Terms, engaged in fraudulent conduct, infringed intellectual property rights, or disrupted platform security.
              </p>
              <p>
                Upon termination, your right to access the portal and educational materials immediately ceases.
              </p>
            </section>

            {/* Section 16 */}
            <section id="section-16" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                16. Modifications to Terms and Conditions
              </h2>
              <p className="mb-4">
                We reserve the right to revise or update these Terms periodically to reflect evolving pedagogical offerings, security standards, or regulatory updates.
              </p>
              <p>
                The updated version will be published on our website along with the "Last Updated" date. Continued use of the website or Services following the posting of modifications constitutes your acceptance of the revised Terms.
              </p>
            </section>

            {/* Section 17 */}
            <section id="section-17" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                17. Grievance Redressal and Contact Information
              </h2>
              <p className="mb-6">
                For questions, clarifications, legal notices, or grievances concerning these Terms and Conditions, please contact us through our official channels:
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
                These Terms and Conditions shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles.
              </p>
              <p>
                In the event of any controversy, claim, or dispute arising out of or relating to these Terms or your use of the Services, the parties shall endeavor to resolve the matter through mutual good-faith consultation. If unresolved, any legal proceedings shall be subject to the exclusive jurisdiction of the competent courts in India.
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
