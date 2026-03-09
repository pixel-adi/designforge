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
    <section ref={sectionRef} className="py-24 bg-grid bg-[#FFFDFB] relative border-b-2 border-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        <div className="bg-container struct-card bg-pop-3/20 p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row gap-12 items-center">
          
          <div className="flex-1">
            <div className="inline-block bg-white border-2 border-foreground text-foreground font-bold uppercase tracking-widest text-xs px-4 py-1.5 rounded-full mb-6 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              The Ecosystem
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black mb-6 text-foreground">
              Start with the <span className="text-pop-1 underline decoration-foreground underline-offset-8">community.</span>
            </h2>
            <p className="text-xl text-foreground/80 font-medium mb-10 leading-relaxed">
              Not every aspirant is ready to commit to a batch on day one. That's why Designforge's WhatsApp community is the best place to begin.
            </p>
            
            <ul className="space-y-5 mb-12">
              <li className="flex items-center gap-4 text-foreground font-bold text-base">
                <div className="w-10 h-10 rounded-lg bg-pop-1 border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <Bell className="w-5 h-5 text-foreground" />
                </div>
                Updates and announcements
              </li>
              <li className="flex items-center gap-4 text-foreground font-bold text-base">
                <div className="w-10 h-10 rounded-lg bg-primary border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <Video className="w-5 h-5 text-white" />
                </div>
                Structured session invites
              </li>
              <li className="flex items-center gap-4 text-foreground font-bold text-base">
                <div className="w-10 h-10 rounded-lg bg-pop-2 border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                Curated resources and prep support
              </li>
            </ul>

            <Button size="lg" className="btn-bold btn-yellow-pop rounded-xl px-8 h-14 uppercase tracking-wider text-sm font-black w-full sm:w-auto">
              Join WhatsApp Community
            </Button>
          </div>
          
          <div className="w-full lg:w-[400px] mockup-card">
            <div className="struct-card p-6 relative bg-white h-[500px] flex flex-col">
               
               <div className="flex items-center gap-4 border-b-2 border-foreground pb-4 mb-6">
                 <div className="w-12 h-12 bg-primary rounded-full border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                   <MessageCircle className="w-6 h-6 text-white" />
                 </div>
                 <div>
                   <p className="font-heading font-black text-foreground text-lg">Designforge Aspirants</p>
                   <p className="text-xs text-muted-foreground font-bold">1,240 members</p>
                 </div>
               </div>
               
               <div className="space-y-5 flex-1 overflow-hidden">
                 <div className="message-bubble bg-pop-3/20 p-4 rounded-xl border-2 border-foreground shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-tl-sm text-sm text-foreground w-[85%]">
                   <span className="font-black text-xs text-foreground mb-1 block">Siddhi (Mentor)</span>
                   Hi everyone! We are hosting a portfolio review session this Sunday.
                 </div>
                 
                 <div className="message-bubble bg-pop-1 text-foreground font-medium p-4 rounded-xl border-2 border-foreground shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-tr-sm text-sm w-[80%] ml-auto">
                   <span className="font-black text-xs text-foreground/70 mb-1 block">Aman</span>
                   Will we cover UCEED specific approaches?
                 </div>
                 
                 <div className="message-bubble bg-pop-2/20 p-4 rounded-xl border-2 border-foreground shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-tl-sm text-sm text-foreground w-[85%]">
                   <span className="font-black text-xs text-foreground mb-1 block">Aditya (Mentor)</span>
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
