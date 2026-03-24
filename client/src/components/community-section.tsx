import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle, Bell, Video, FileText } from "lucide-react";
import gsap from 'gsap';

export function CommunitySection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        }
      });

      tl.fromTo(".comm-blob", { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "power2.out" })
        .fromTo(".comm-text", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 }, "-=0.5")
        .fromTo(".message-bubble", { y: 15, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: "back.out(1.2)" }, "-=0.3");

      // Continuous float for the phone container
      gsap.to(".phone-container", {
        y: 15,
        rotation: 1,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 bg-background relative overflow-hidden">
      {/* Background organic shape */}
      <div className="comm-blob absolute top-1/2 right-0 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full opacity-60 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)' }}></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          <div className="flex-1 max-w-2xl">
            <h2 className="comm-text text-5xl md:text-6xl font-heading mb-8 leading-[1.1] text-[#e94a35]">
              Start with the <span className="text-primary italic">community.</span>
            </h2>
            <p className="comm-text text-xl md:text-2xl text-foreground/60 font-light mb-12 leading-relaxed">
              Not every aspirant is ready to commit to a batch on day one. That's why Designforge's WhatsApp community is a thriving space to simply begin observing and learning.
            </p>
            
            <ul className="space-y-6 mb-12">
              <li className="comm-text flex items-center gap-5 text-foreground font-medium text-lg">
                <div className="w-12 h-12 rounded-full bg-pop-1/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-pop-1" />
                </div>
                Important updates and prompt announcements
              </li>
              <li className="comm-text flex items-center gap-5 text-foreground font-medium text-lg">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                Open structured session invites
              </li>
              <li className="comm-text flex items-center gap-5 text-foreground font-medium text-lg">
                <div className="w-12 h-12 rounded-full bg-pop-3/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-pop-3" />
                </div>
                Curated resources and peer critique
              </li>
            </ul>

            <div className="comm-text">
              <Button asChild size="lg" className="btn-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(255,107,107,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,107,0.23)] hover:-translate-y-0.5 transition-all rounded-full px-10 h-16 text-base w-full sm:w-auto">
                <a href="https://chat.whatsapp.com/FJGc9od7fbz7iRXsFnzYU0" target="_blank" rel="noopener noreferrer">
                  Join WhatsApp Community
                </a>
              </Button>
            </div>
          </div>
          
          <div className="w-full lg:w-[450px] relative">
            <div className="phone-container struct-card p-6 bg-white/80 border border-white h-[550px] flex flex-col shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]">
               
               <div className="flex items-center gap-4 pb-4 mb-6 border-b border-black/5">
                 <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-inner">
                   <MessageCircle className="w-6 h-6 text-background" />
                 </div>
                 <div>
                   <p className="font-heading text-xl text-foreground">Designforge Aspirants</p>
                   <p className="text-xs text-foreground/50 font-medium">3,242 members online</p>
                 </div>
               </div>
               
               <div className="space-y-6 flex-1 overflow-hidden flex flex-col justify-end pb-4">
                 <div className="message-bubble bg-background p-4 rounded-2xl rounded-tl-sm text-[15px] text-foreground w-[85%] border border-black/5 shadow-sm">
                   <span className="font-medium text-xs text-primary mb-1 block">Mentor</span>
                   Hi everyone! We are hosting an open portfolio review session this Sunday. Drop your links!
                 </div>
                 
                 <div className="message-bubble bg-primary text-background p-4 rounded-2xl rounded-tr-sm text-[15px] w-[80%] ml-auto shadow-md">
                   <span className="font-medium text-xs text-background/70 mb-1 block">Aman</span>
                   Will we cover UCEED specific approaches in this one?
                 </div>
                 
                 <div className="message-bubble bg-background p-4 rounded-2xl rounded-tl-sm text-[15px] text-foreground w-[85%] border border-black/5 shadow-sm">
                   <span className="font-medium text-xs text-pop-1 mb-1 block">Mentor</span>
                   Yes, both NID narrative building and UCEED problem framing will be discussed. See you there! ✨
                 </div>
               </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
