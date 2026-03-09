import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle, Bell, Video, FileText, Zap } from "lucide-react";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function CommunitySection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const container = sectionRef.current?.querySelector('.bg-container');
      const listItems = sectionRef.current?.querySelectorAll('li');
      const phoneMockup = sectionRef.current?.querySelector('.phone-mockup');
      const messages = sectionRef.current?.querySelectorAll('.message-bubble');
      
      gsap.fromTo(container,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, scrollTrigger: { trigger: container, start: "top 80%" } }
      );

      gsap.fromTo(listItems,
        { x: -30, opacity: 0 },
        { 
          x: 0, 
          opacity: 1, 
          duration: 0.5, 
          stagger: 0.1,
          scrollTrigger: { trigger: container, start: "top 70%" }
        }
      );

      gsap.fromTo(phoneMockup,
        { y: 50, opacity: 0, rotation: 5 },
        { 
          y: 0, 
          opacity: 1, 
          rotation: 0,
          duration: 0.8, 
          ease: "back.out(1.2)",
          scrollTrigger: { trigger: phoneMockup, start: "top 80%" }
        }
      );

      gsap.fromTo(messages,
        { scale: 0.8, opacity: 0, y: 20 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.2,
          ease: "back.out(2)",
          scrollTrigger: { trigger: phoneMockup, start: "top 60%" }
        }
      );
      
      // Floating animation for abstract elements
      gsap.to('.abstract-float', {
        y: "random(-10, 10)",
        rotation: "random(-15, 15)",
        duration: "random(2, 4)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-dots relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        
        <div className="bg-container bg-[#FFF4ED] rounded-[2.5rem] p-8 md:p-16 border-2 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)] flex flex-col md:flex-row gap-12 items-center relative z-10">
          
          {/* Decorative shapes */}
          <svg className="abstract-float absolute top-10 right-10 w-12 h-12 text-primary z-0 opacity-50" viewBox="0 0 100 100" fill="currentColor">
             <polygon points="50,0 60,40 100,50 60,60 50,100 40,60 0,50 40,40" />
          </svg>
          <div className="abstract-float absolute bottom-10 left-10 w-16 h-16 border-4 border-dashed border-secondary rounded-full z-0 opacity-20"></div>

          <div className="flex-1 relative z-10">
            <p className="text-primary font-bold text-xs uppercase tracking-widest mb-4">The Ecosystem</p>
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 text-foreground">
              Start with the community.
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Not every aspirant is ready to commit to a batch on day one. That's why Designforge's WhatsApp community is the best place to begin — a space to stay connected to sessions, resources, opportunities, and a serious peer ecosystem.
            </p>
            
            <ul className="space-y-5 mb-10">
              <li className="flex items-center gap-4 text-foreground font-medium">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                Updates and announcements
              </li>
              <li className="flex items-center gap-4 text-foreground font-medium">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <Video className="w-5 h-5 text-secondary" />
                </div>
                Session invites
              </li>
              <li className="flex items-center gap-4 text-foreground font-medium">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                Resources and prep support
              </li>
            </ul>

            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white btn-orange rounded-xl px-8 h-14 uppercase tracking-wider text-sm font-bold w-full sm:w-auto">
              Join WhatsApp Community
            </Button>
          </div>
          
          <div className="w-full max-w-sm phone-mockup relative z-10">
            <div className="bg-white rounded-[2rem] border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6 relative h-[500px] flex flex-col">
               {/* Phone Notch */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-foreground rounded-b-xl"></div>
               
               <div className="flex items-center gap-4 border-b-2 border-border/50 pb-4 mb-6 mt-4">
                 <div className="w-12 h-12 bg-[#F0F8FA] border-2 border-foreground rounded-full flex items-center justify-center">
                   <MessageCircle className="w-6 h-6 text-secondary fill-secondary" />
                 </div>
                 <div>
                   <p className="font-heading font-bold text-foreground">Designforge Aspirants</p>
                   <p className="text-xs text-muted-foreground font-bold">1,240 members</p>
                 </div>
               </div>
               
               <div className="space-y-6 flex-1 overflow-hidden">
                 <div className="message-bubble bg-muted/50 border border-border p-4 rounded-2xl rounded-tl-sm text-sm text-foreground w-[85%] shadow-sm relative">
                   <span className="font-bold text-xs text-primary mb-1 block">Siddhi (Admin)</span>
                   Hi everyone! We are hosting a portfolio review session this Sunday. Link above! 👆
                 </div>
                 
                 <div className="message-bubble bg-primary text-white p-4 rounded-2xl rounded-tr-sm text-sm w-[80%] ml-auto shadow-sm relative">
                   <span className="font-bold text-xs text-white/70 mb-1 block">Aman</span>
                   Will we cover UCEED specific approaches?
                 </div>
                 
                 <div className="message-bubble bg-muted/50 border border-border p-4 rounded-2xl rounded-tl-sm text-sm text-foreground w-[85%] shadow-sm relative">
                   <span className="font-bold text-xs text-secondary mb-1 block">Aditya (Admin)</span>
                   Yes, both NID and UCEED problem framing will be discussed. See you there!
                 </div>
               </div>

               {/* Mock Input */}
               <div className="mt-4 pt-4 border-t-2 border-border/50 flex gap-2">
                 <div className="flex-1 bg-muted rounded-full h-10 border border-border"></div>
                 <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-4 h-4 text-white translate-x-[-1px]" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                 </div>
               </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
