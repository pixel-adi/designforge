import { Button } from "@/components/ui/button";
import { MessageCircle, Bell, Video, FileText, Zap } from "lucide-react";

export function CommunitySection() {
  return (
    <section className="py-24 bg-white relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        
        <div className="bg-primary/5 rounded-3xl p-8 md:p-16 border border-primary/20 flex flex-col md:flex-row gap-12 items-center">
          
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-secondary">
              Start with the community
            </h2>
            <p className="text-lg text-muted-foreground font-light mb-8 leading-relaxed">
              Not every aspirant is ready to commit to a batch on day one. That's why Designforge's WhatsApp community is the best place to begin — a space to stay connected to sessions, resources, opportunities, discussions, and a serious peer ecosystem.
            </p>
            
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3 text-secondary font-medium">
                <Bell className="w-5 h-5 text-primary" /> Updates and announcements
              </li>
              <li className="flex items-center gap-3 text-secondary font-medium">
                <Video className="w-5 h-5 text-primary" /> Session invites
              </li>
              <li className="flex items-center gap-3 text-secondary font-medium">
                <FileText className="w-5 h-5 text-primary" /> Resources and prep support
              </li>
              <li className="flex items-center gap-3 text-secondary font-medium">
                <Zap className="w-5 h-5 text-primary" /> Motivation through community
              </li>
            </ul>

            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white btn-minimal px-8">
              Join WhatsApp Community
            </Button>
          </div>
          
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-6 relative">
               <div className="flex items-center gap-4 border-b border-border/50 pb-4 mb-4">
                 <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                   <MessageCircle className="w-6 h-6 text-secondary" />
                 </div>
                 <div>
                   <p className="font-bold text-secondary">Designforge Aspirants</p>
                   <p className="text-xs text-muted-foreground">1,240 members</p>
                 </div>
               </div>
               <div className="space-y-4">
                 <div className="bg-muted/30 p-3 rounded-2xl rounded-tl-sm text-sm text-secondary w-[80%]">
                   Hi everyone! We are hosting a portfolio review session this Sunday.
                 </div>
                 <div className="bg-primary/10 p-3 rounded-2xl rounded-tr-sm text-sm text-secondary w-[80%] ml-auto text-right">
                   Will we cover UCEED specific portfolios?
                 </div>
                 <div className="bg-muted/30 p-3 rounded-2xl rounded-tl-sm text-sm text-secondary w-[80%]">
                   Yes, both NID and UCEED approaches will be discussed.
                 </div>
               </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
