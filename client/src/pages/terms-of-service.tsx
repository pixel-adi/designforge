import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 animate-section">
        <div className="max-w-3xl mx-auto">
          {/* Back Navigation */}
          <Link href="/">
            <a className="inline-flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-primary transition-colors mb-12 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </a>
          </Link>

          {/* Header */}
          <div className="mb-16">
            <h1 className="text-4xl md:text-5xl font-heading text-foreground mb-6">
              Terms of Service
            </h1>
            <div className="w-20 h-1 bg-primary rounded-full"></div>
          </div>

          {/* Content */}
          <div className="prose prose-lg prose-headings:font-heading prose-headings:font-normal prose-p:text-foreground/80 prose-p:leading-relaxed prose-a:text-primary hover:prose-a:text-primary/80 prose-li:text-foreground/80 max-w-none space-y-8">
            
            <div className="p-6 md:p-8 rounded-2xl bg-white border border-black/5 shadow-sm">
              <p className="text-xl font-medium text-foreground m-0">
                By using the Designforge website, programs, workshops, or community spaces, you agree to use them respectfully and responsibly.
              </p>
            </div>

            <p>
              All content on this website, including text, branding, and materials, belongs to Designforge unless stated otherwise. It should not be copied or used without permission.
            </p>

            <p className="p-6 md:p-8 rounded-2xl bg-white/50 border border-black/5">
              If you join a program, workshop, or mentorship, you are expected to share correct information and maintain respectful conduct with mentors, learners, and the Designforge team.
            </p>

            <p>
              Designforge may update, change, or stop any part of the website, program, or offering when needed.
            </p>

            <div className="my-12 p-8 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="font-medium text-foreground m-0 leading-relaxed">
                While we aim to provide meaningful support and guidance, we do not guarantee admissions, placements, internships, or specific outcomes.
              </p>
            </div>

            <p className="mt-12 font-medium text-foreground pt-8 border-t border-black/5">
              By continuing to use this website, you agree to these terms.
            </p>

            <div className="mt-16 pt-8 border-t border-black/10">
              <p className="text-sm text-foreground/60 uppercase tracking-wider font-semibold mb-2">Contact Us</p>
              <a href="mailto:designforge05@gmail.com" className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                designforge05@gmail.com
              </a>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
