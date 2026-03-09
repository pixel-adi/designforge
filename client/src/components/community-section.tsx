import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle, Bell, Video, FileText } from "lucide-react";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function CommunitySection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const container = sectionRef.current?.querySelector('.bg-container');
      const listItems = sectionRef.current?.querySelectorAll('li');
      const mockup = sectionRef.current?.querySelector('.mockup-card');
      const messages = sectionRef.current?.querySelectorAll('.message-bubble');
      
      gsap.fromTo(container,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, scrollTrigger: { trigger: container, start: "top 80%" } }
      );

      gsap.fromTo(listItems,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.1, scrollTrigger: { trigger: container, start: "top 70%" } }
      );

      gsap.fromTo(mockup,
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: "power2.out", scrollTrigger: { trigger: mockup, start: "top 80%" } }
      );

      gsap.fromTo(messages,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.15, ease: "power2.out", scrollTrigger: { trigger: mockup, start: "top 60%" } }
      );

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-[#FAFAFA] relative border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        
        <div className="bg-container struct-card p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row gap-12 items-center">
          
          <div className="flex-1">
            <p className="text-primary font-bold text-xs uppercase tracking-widest mb-4">The Ecosystem</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6 text-foreground">
              Start with the community.
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Not every aspirant is ready to commit to a batch on day one. That's why Designforge's WhatsApp community is the best place to begin — a structured space for sessions, resources, and peer feedback.
            </p>
            
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-4 text-foreground font-medium text-sm">
                <div className="w-8 h-8 rounded bg-muted border border-border flex items-center justify-center">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                Updates and announcements
              </li>
              <li className="flex items-center gap-4 text-foreground font-medium text-sm">
                <div className="w-8 h-8 rounded bg-muted border border-border flex items-center justify-center">
                  <Video className="w-4 h-4 text-secondary" />
                </div>
                Structured session invites
              </li>
              <li className="flex items-center gap-4 text-foreground font-medium text-sm">
                <div className="w-8 h-8 rounded bg-muted border border-border flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                Curated resources and prep support
              </li>
            </ul>

            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white btn-orange rounded-lg px-8 h-12 uppercase tracking-wider text-sm font-bold w-full sm:w-auto shadow-sm">
              Join WhatsApp Community
            </Button>
          </div>
          
          <div className="w-full lg:w-96 mockup-card">
            <div className="struct-card p-6 relative bg-white shadow-lg border-border">
               
               <div className="flex items-center gap-4 border-b border-border pb-4 mb-6">
                 <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                   <MessageCircle className="w-5 h-5 text-primary" />
                 </div>
                 <div>
                   <p className="font-heading font-bold text-foreground text-sm">Designforge Aspirants</p>
                   <p className="text-xs text-muted-foreground">1,240 members</p>
                 </div>
               </div>
               
               <div className="space-y-4">
                 <div className="message-bubble bg-muted p-3 rounded-lg rounded-tl-sm text-sm text-foreground w-[85%] border border-border">
                   <span className="font-bold text-xs text-primary mb-1 block">Siddhi (Mentor)</span>
                   Hi everyone! We are hosting a portfolio review session this Sunday.
                 </div>
                 
                 <div className="message-bubble bg-secondary text-white p-3 rounded-lg rounded-tr-sm text-sm w-[80%] ml-auto border border-secondary">
                   <span className="font-bold text-xs text-white/70 mb-1 block">Aman</span>
                   Will we cover UCEED specific approaches?
                 </div>
                 
                 <div className="message-bubble bg-muted p-3 rounded-lg rounded-tl-sm text-sm text-foreground w-[85%] border border-border">
                   <span className="font-bold text-xs text-primary mb-1 block">Aditya (Mentor)</span>
                   Yes, both NID and UCEED problem framing will be discussed. See you there!
                 </div>
               </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
