import { Link } from "wouter";
import { ArrowLeft, Shield, Mail, Phone, Globe, Calendar, Lock, CheckCircle2, ChevronRight, FileText } from "lucide-react";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

const sections = [
  { id: "section-1", title: "1. Introduction" },
  { id: "section-2", title: "2. Scope of This Policy" },
  { id: "section-3", title: "3. Information We Collect" },
  { id: "section-4", title: "4. Purpose of Information Collection" },
  { id: "section-5", title: "5. Consent and Lawful Processing" },
  { id: "section-6", title: "6. Academic Data and Learning Analytics" },
  { id: "section-7", title: "7. Student Submissions and Creative Work" },
  { id: "section-8", title: "8. Information Sharing and Disclosure" },
  { id: "section-9", title: "9. Third Party Platforms" },
  { id: "section-10", title: "10. Cookies and Website Technologies" },
  { id: "section-11", title: "11. Data Protection and Security" },
  { id: "section-12", title: "12. Data Retention" },
  { id: "section-13", title: "13. Privacy of Minors" },
  { id: "section-14", title: "14. User Rights" },
  { id: "section-15", title: "15. Marketing Communications" },
  { id: "section-16", title: "16. External Website Links" },
  { id: "section-17", title: "17. International Data Processing" },
  { id: "section-18", title: "18. Data Breach Management" },
  { id: "section-19", title: "19. Changes to This Privacy Policy" },
  { id: "section-20", title: "20. Contact and Privacy Grievances" },
  { id: "section-21", title: "21. Governing Law" },
];

export default function PrivacyPolicy() {
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
              <Shield className="w-3.5 h-3.5" />
              <span>Official Privacy Policy</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading text-foreground mb-4 tracking-tight">
              Privacy Policy
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

          {/* Policy Sections */}
          <div className="space-y-12 text-foreground/85 leading-relaxed text-base md:text-lg">
            
            {/* Section 1 */}
            <section id="section-1" className="scroll-mt-28">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                1. Introduction
              </h2>
              <p className="mb-4">
                Designforge, formerly known as Whitespace Design Foundation, is an educational and mentorship initiative dedicated to making design education, creative learning, and professional guidance more accessible.
              </p>
              <p className="mb-4">
                This Privacy Policy explains how Designforge collects, uses, processes, stores, protects, and discloses personal information obtained through its website, learning platform, educational programmes, mentorship services, workshops, assessments, and associated digital services.
              </p>
              <p className="mb-4">
                By accessing or using our services, you acknowledge this Privacy Policy. Where consent is required by applicable law, Designforge will obtain such consent separately and through an appropriate affirmative action.
              </p>
              <p>
                Designforge is committed to handling personal information responsibly and in accordance with applicable Indian laws.
              </p>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                2. Scope of This Policy
              </h2>
              <p className="mb-4">
                This Privacy Policy applies to individuals who visit the Designforge website, register for accounts, enrol in educational programmes, participate in workshops, attend mentorship sessions, submit assignments, take assessments, communicate with our team, or otherwise interact with our services.
              </p>
              <p className="mb-4">
                It also applies to information processed through authorised service providers acting on behalf of Designforge.
              </p>
              <p>
                Third party websites and independent services may maintain their own privacy policies, which should be reviewed separately.
              </p>
            </section>

            {/* Section 3 */}
            <section id="section-3" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                3. Information We Collect
              </h2>
              <p className="mb-6">
                Designforge collects information relevant to delivering its educational services and maintaining an effective learning environment.
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-heading text-foreground mb-2">3.1 Personal Information</h3>
                  <p className="m-0">
                    We may collect names, email addresses, mobile phone numbers, age or date of birth when necessary, educational qualifications, academic interests, examination preferences, and other information voluntarily provided during registration.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-heading text-foreground mb-2">3.2 Account Information</h3>
                  <p className="m-0">
                    We may collect account identifiers, enrolment history, programme selections, authentication information, login activity, and preferences necessary for operating our learning platform.
                  </p>
                  <p className="mt-2 text-foreground/70 text-sm">
                    Passwords, where applicable, should be maintained through appropriate security mechanisms rather than stored in readable form.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-heading text-foreground mb-2">3.3 Educational Information</h3>
                  <p className="m-0">
                    We may collect assignments, portfolios, sketches, examination responses, evaluation scores, mock test results, performance analytics, attendance records, and feedback submitted during participation in our programmes.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-heading text-foreground mb-2">3.4 Payment Information</h3>
                  <p className="m-0">
                    We may retain transaction identifiers, payment amounts, payment status, invoice details, and information necessary to manage purchases, refunds, and financial records.
                  </p>
                  <p className="mt-2 text-foreground/70 text-sm">
                    Payments may be processed through authorised external payment service providers. Designforge does not require access to complete payment card details for normal transaction processing.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-heading text-foreground mb-2">3.5 Technical Information</h3>
                  <p className="m-0">
                    Our website and learning platform may process information such as browser type, device information, operating system, session information, cookies, and technical activity logs necessary for security, authentication, and platform functionality.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-heading text-foreground mb-2">3.6 Communication Information</h3>
                  <p className="m-0">
                    We may retain enquiries, support requests, feedback, messages, and correspondence shared through official communication channels.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                4. Purpose of Information Collection
              </h2>
              <p className="mb-4">
                Designforge processes personal information for legitimate and specified purposes connected with providing educational services.
              </p>
              <p className="mb-4">
                These purposes include registering students, creating learning accounts, administering enrolments, conducting classes, delivering course materials, evaluating student submissions, generating performance reports, managing mentorship activities, processing payments, providing support, and communicating academic announcements.
              </p>
              <p className="mb-4">
                Information may also be processed to maintain platform security, investigate misuse, resolve complaints, improve educational delivery, and comply with applicable legal obligations.
              </p>
              <p>
                We will not use personal information for purposes incompatible with those communicated to users unless an appropriate legal basis exists.
              </p>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                5. Consent and Lawful Processing
              </h2>
              <p className="mb-4">
                Where applicable law requires consent, Designforge will seek consent that is informed, specific, and capable of being withdrawn in accordance with legal requirements.
              </p>
              <p className="mb-4">
                Certain information may be necessary for the performance of requested services or compliance with legal obligations.
              </p>
              <p className="mb-4">
                Users may withdraw applicable consent by contacting Designforge through its official support channels.
              </p>
              <p>
                Withdrawal may affect the availability of services that depend on the relevant information. Such withdrawal does not automatically create an entitlement to refund fees for services already delivered.
              </p>
            </section>

            {/* Section 6 */}
            <section id="section-6" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                6. Academic Data and Learning Analytics
              </h2>
              <p className="mb-4">
                Designforge may analyse students' academic performance, assessment responses, completion rates, submission quality, and learning progress to provide educational feedback and improve its programmes.
              </p>
              <p className="mb-4">
                Academic performance reports may be made available to the relevant student, authorised mentors, administrators, and, where appropriate and lawfully authorised, parents or guardians.
              </p>
              <p className="mb-4">
                Designforge may use aggregated or appropriately anonymised academic information for educational research, internal benchmarking, and programme improvement.
              </p>
              <p>
                Identifiable student information will not be publicly disclosed for promotional purposes without appropriate permission or another valid legal basis.
              </p>
            </section>

            {/* Section 7 */}
            <section id="section-7" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                7. Student Submissions and Creative Work
              </h2>
              <p className="mb-4">
                Students may submit drawings, portfolios, written responses, concepts, presentations, videos, and other original creative materials for evaluation.
              </p>
              <p className="mb-4 font-semibold text-foreground">
                Ownership of original student work remains with the respective student, subject to applicable third party intellectual property rights.
              </p>
              <p className="mb-4">
                By submitting academic work, students grant Designforge permission to access, reproduce internally, review, annotate, and retain the material to the extent reasonably necessary for educational delivery, evaluation, feedback, and academic administration.
              </p>
              <p>
                Public display of identifiable student work for marketing, testimonials, case studies, or promotional activities will require appropriate permission.
              </p>
            </section>

            {/* Section 8 */}
            <section id="section-8" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                8. Information Sharing and Disclosure
              </h2>
              <p className="mb-4 font-semibold text-primary">
                Designforge does not sell personal information to advertisers or data brokers.
              </p>
              <p className="mb-4">
                Personal information may be shared with authorised service providers where reasonably necessary for operating the services.
              </p>
              <p className="mb-4">
                Such providers may include learning platform operators, cloud infrastructure providers, payment processors, communication platforms, assessment tools, and technical support providers.
              </p>
              <p className="mb-4">
                Relevant information may also be disclosed to competent authorities when required by applicable law, valid legal processes, or lawful regulatory requests.
              </p>
              <p>
                Designforge will seek to limit disclosure to information reasonably necessary for the relevant purpose.
              </p>
            </section>

            {/* Section 9 */}
            <section id="section-9" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                9. Third Party Platforms
              </h2>
              <p className="mb-4">
                Designforge may use external services to conduct classes, manage payments, distribute educational resources, deliver communications, or facilitate community discussions.
              </p>
              <p className="mb-4">
                These providers may process information in accordance with their own privacy policies and contractual responsibilities.
              </p>
              <p className="mb-4">
                Designforge is not responsible for independent actions of third party services outside its reasonable control.
              </p>
              <p>
                Users are encouraged to review the privacy practices of platforms they access.
              </p>
            </section>

            {/* Section 10 */}
            <section id="section-10" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                10. Cookies and Website Technologies
              </h2>
              <p className="mb-4">
                Designforge may use cookies and similar technologies for authentication, session management, website functionality, security, and performance analysis.
              </p>
              <p className="mb-4">
                Essential cookies may be necessary for the proper functioning of the website and learning platform.
              </p>
              <p className="mb-4">
                Nonessential analytics or tracking technologies will be used subject to applicable notice and consent requirements.
              </p>
              <p>
                Users may control certain cookies through browser settings, although restricting essential cookies may affect platform functionality.
              </p>
            </section>

            {/* Section 11 */}
            <section id="section-11" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                11. Data Protection and Security
              </h2>
              <p className="mb-4">
                Designforge implements reasonable technical and organisational safeguards appropriate to the nature of the information processed.
              </p>
              <p className="mb-4">
                These may include access restrictions, secure authentication, protected hosting infrastructure, authorised administrative access, and internal controls governing information handling.
              </p>
              <p className="mb-4">
                Access to personal information is limited to individuals and service providers who require it for legitimate operational purposes.
              </p>
              <p>
                Although reasonable measures are taken to protect information, no digital platform can guarantee absolute protection against every security threat.
              </p>
            </section>

            {/* Section 12 */}
            <section id="section-12" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                12. Data Retention
              </h2>
              <p className="mb-4">
                Personal information will be retained for periods reasonably necessary to provide educational services, maintain academic records, manage transactions, resolve disputes, prevent fraud, and comply with applicable legal requirements.
              </p>
              <p className="mb-4">
                Retention periods may vary according to the type of information and the purpose for which it was collected.
              </p>
              <p className="mb-4">
                When information is no longer reasonably required, Designforge will delete, anonymise, or otherwise securely dispose of it, subject to applicable legal requirements.
              </p>
              <p>
                Requests for account deletion will be evaluated in accordance with applicable law and legitimate retention obligations.
              </p>
            </section>

            {/* Section 13 */}
            <section id="section-13" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                13. Privacy of Minors
              </h2>
              <p className="mb-4">
                Designforge recognises that some educational programmes may be accessed by students below 18 years of age.
              </p>
              <p className="mb-4">
                Where legally required, personal information concerning minors will be processed only after obtaining appropriate consent from a parent or lawful guardian.
              </p>
              <p className="mb-4">
                Parents or guardians are responsible for authorising registration and supervising participation where appropriate.
              </p>
              <p>
                Designforge will apply the safeguards required by applicable law for processing children's personal information.
              </p>
            </section>

            {/* Section 14 */}
            <section id="section-14" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                14. User Rights
              </h2>
              <p className="mb-4">
                Subject to applicable law, users may request access to information about personal data processing, correction of inaccurate information, completion of incomplete information, updating of relevant information, or deletion of information where legally permissible.
              </p>
              <p className="mb-4">
                Users may also request withdrawal of applicable consent and submit grievances regarding the handling of their personal information.
              </p>
              <p className="mb-4">
                Requests must be made through official Designforge communication channels and may be subject to reasonable identity verification.
              </p>
              <p>
                Designforge may retain certain information where required for compliance, legitimate dispute resolution, or other legally authorised purposes.
              </p>
            </section>

            {/* Section 15 */}
            <section id="section-15" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                15. Marketing Communications
              </h2>
              <p className="mb-4">
                Designforge may communicate programme announcements, educational opportunities, workshops, community activities, and relevant updates to individuals who have appropriately agreed to receive such communications or where another lawful basis exists.
              </p>
              <p className="mb-4">
                Users may opt out of promotional communications through available unsubscribe mechanisms or by contacting Designforge.
              </p>
              <p>
                Essential communications concerning existing enrolments, transactions, service delivery, and account security may continue where legally permitted.
              </p>
            </section>

            {/* Section 16 */}
            <section id="section-16" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                16. External Website Links
              </h2>
              <p className="mb-4">
                The Designforge website may contain links to websites, applications, and resources operated by independent organisations.
              </p>
              <p className="mb-4">
                Designforge does not control the content, security, or information practices of such external services.
              </p>
              <p>
                Accessing external resources is subject to the policies and conditions of their respective operators.
              </p>
            </section>

            {/* Section 17 */}
            <section id="section-17" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                17. International Data Processing
              </h2>
              <p className="mb-4">
                Some authorised technology providers may process or store information outside India.
              </p>
              <p>
                Where such processing occurs, Designforge will take reasonable steps to ensure compliance with applicable Indian data protection requirements and any relevant restrictions on international transfers.
              </p>
            </section>

            {/* Section 18 */}
            <section id="section-18" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                18. Data Breach Management
              </h2>
              <p>
                If Designforge becomes aware of a personal data breach, it will assess the nature and impact of the incident, take appropriate containment and remediation measures, and issue notifications to affected individuals or authorities where required by applicable law.
              </p>
            </section>

            {/* Section 19 */}
            <section id="section-19" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                19. Changes to This Privacy Policy
              </h2>
              <p className="mb-4">
                Designforge reserves the right to revise this Privacy Policy to reflect changes in its services, operational practices, technology, or applicable law.
              </p>
              <p className="mb-4">
                Updated versions will be published on the official website.
              </p>
              <p>
                Where required, material changes will be communicated to affected individuals and additional consent will be obtained where legally necessary.
              </p>
            </section>

            {/* Section 20 */}
            <section id="section-20" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                20. Contact and Privacy Grievances
              </h2>
              <p className="mb-6">
                Privacy enquiries, data requests, corrections, withdrawal requests, and grievances may be directed to:
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
                      <p className="text-xs uppercase font-semibold text-foreground/50 tracking-wider">Email</p>
                      <a href="mailto:designforge05@gmail.com" className="text-foreground hover:text-primary transition-colors font-medium">
                        designforge05@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs uppercase font-semibold text-foreground/50 tracking-wider">Grievance Contact</p>
                      <p className="text-foreground font-medium m-0">
                        Designforge Grievance Redressal Officer
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-foreground/60 pt-4 border-t border-black/5 m-0">
                  Designforge will address legitimate privacy requests and grievances within applicable legal timelines.
                </p>
              </div>
            </section>

            {/* Section 21 */}
            <section id="section-21" className="scroll-mt-28 pt-8 border-t border-black/5">
              <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-4">
                21. Governing Law
              </h2>
              <p className="mb-4">
                This Privacy Policy is governed by the applicable laws of India.
              </p>
              <p>
                Any dispute concerning personal information will be subject to applicable statutory remedies and the jurisdiction of competent authorities or courts as determined by law.
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
