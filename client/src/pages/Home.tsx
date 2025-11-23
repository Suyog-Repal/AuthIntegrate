import { Button } from "@/components/ui/button";
import { Fingerprint, Lock, ShieldCheck, Activity, Users, Cpu, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  // Background Pattern Component
  const BackgroundPattern = () => (
    <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]">
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden selection:bg-primary/20">
      <BackgroundPattern />

      {/* HERO SECTION */}
      <section className="flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center lg:pt-40">
        
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          System Operational v2.0
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, type: "spring" }}
          className="relative mb-6"
        >
          <div className="absolute inset-0 blur-2xl bg-primary/30 rounded-full opacity-50" />
          <Fingerprint className="relative w-20 h-20 text-primary" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="max-w-4xl text-5xl font-extrabold tracking-tight md:text-7xl mb-6"
        >
          Secure your world with <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
            Dual-Factor Intelligence
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="max-w-2xl text-muted-foreground text-lg md:text-xl leading-relaxed mb-10"
        >
          Experience enterprise-grade security monitoring. Combining high-speed
          <span className="font-semibold text-foreground"> ESP32 hardware biometrics</span> with 
          real-time WebSocket data analysis.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button 
            size="lg" 
            onClick={() => setLocation("/login")}
            className="h-12 px-8 text-base rounded-full shadow-lg hover:shadow-primary/25 transition-all duration-300"
          >
            Access Dashboard <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="h-12 px-8 text-base rounded-full bg-background/50 backdrop-blur-sm hover:bg-accent/50"
          >
            View Documentation
          </Button>
        </motion.div>
      </section>

      {/* FEATURES SECTION */}
      <section className="px-6 py-24 bg-muted/30 border-t border-border/50 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">System Capabilities</h2>
            <p className="text-muted-foreground">Built for speed, security, and scalability.</p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { icon: ShieldCheck, title: "Double-Layer Auth", desc: "Hardware biometrics meets software tokens for impenetrable security." },
              { icon: Activity, title: "Live Telemetry", desc: "WebSocket connections ensure zero-latency monitoring logs." },
              { icon: Users, title: "Role Hierarchy", desc: "Granular control over Admin, Moderator, and User permissions." },
              { icon: Lock, title: "Encrypted Core", desc: "End-to-end encryption ensures data integrity at rest and in transit." },
              { icon: Fingerprint, title: "Biometric Sync", desc: "Seamless integration with ESP32 optical fingerprint modules." },
              { icon: Cpu, title: "High Performance", desc: "Powered by Express, MySQL, and TypeScript for maximum throughput." },
            ].map((f, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="group relative p-8 rounded-2xl border bg-card hover:border-primary/50 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                  <CheckCircle2 className="w-12 h-12 text-primary" />
                </div>
                <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl mb-3 tracking-tight">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            Engineered by <span className="font-semibold text-foreground">Suyog Repal</span> 
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" /> 
            EXTC Sem V
          </p>
          <p className="text-xs text-muted-foreground mt-2 opacity-50">
            © {new Date().getFullYear()} AuthIntegrate Systems.
          </p>
        </div>
      </footer>
    </div>
  );
}