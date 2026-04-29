import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Leaf, ArrowRight, CalendarCheck, Stethoscope, FlaskConical, Pill,
  Shield, Heart, Phone, Mail, MapPin, Clock, Star, Users,
  ChevronRight, Menu, X, Activity, FileText, CreditCard,
} from "lucide-react";

const services = [
  { icon: Stethoscope, title: "General Checkup", desc: "Comprehensive health screening and routine examinations by certified doctors." },
  { icon: Heart, title: "Cardiology", desc: "Advanced cardiac care including ECG, echocardiography, and heart surgery." },
  { icon: FlaskConical, title: "Laboratory", desc: "State-of-the-art diagnostic lab with fast and accurate test results." },
  { icon: Pill, title: "Pharmacy", desc: "In-house pharmacy with a complete range of medicines at affordable prices." },
  { icon: Activity, title: "Emergency Care", desc: "24/7 emergency services with ambulance and trauma care facilities." },
  { icon: Shield, title: "Insurance Support", desc: "We accept all major insurance providers for hassle-free billing." },
];

const doctors = [
  { name: "Dr. Sarah Rahman", specialty: "Cardiologist", exp: "15 Years", rating: 4.9, img: "SR" },
  { name: "Dr. Ahmed Khan", specialty: "Neurologist", exp: "12 Years", rating: 4.8, img: "AK" },
  { name: "Dr. Fatima Akter", specialty: "Dermatologist", exp: "10 Years", rating: 4.9, img: "FA" },
  { name: "Dr. Hasan Ali", specialty: "Orthopedic", exp: "18 Years", rating: 4.7, img: "HA" },
];

const stats = [
  { value: "15K+", label: "Happy Patients" },
  { value: "50+", label: "Expert Doctors" },
  { value: "24/7", label: "Emergency Care" },
  { value: "20+", label: "Departments" },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* ═══ NAVBAR ═══ */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-btn">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-extrabold text-foreground tracking-tight">Medicare Cure Hub</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {["Home", "Services", "Doctors", "Contact"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
                >
                  {item}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/auth">
                <Button variant="outline" className="rounded-xl h-10 px-5 text-sm font-semibold">
                  Login
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="rounded-xl h-10 px-5 text-sm font-semibold gradient-btn text-white border-0">
                  Register
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2 animate-fade-in-up">
              {["Home", "Services", "Doctors", "Contact"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <div className="flex gap-2 pt-2 px-2">
                <Link to="/auth" className="flex-1">
                  <Button variant="outline" className="w-full rounded-xl h-10 text-sm font-semibold">Login</Button>
                </Link>
                <Link to="/auth" className="flex-1">
                  <Button className="w-full rounded-xl h-10 text-sm font-semibold gradient-btn text-white border-0">Register</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 md:space-y-8">
              <Badge className="rounded-full px-4 py-1.5 text-xs font-semibold bg-secondary/10 text-secondary border-secondary/20">
                🏥 Trusted by 15,000+ Patients
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1]">
                Your Health,{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Our Priority
                </span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
                Experience world-class healthcare with our team of expert doctors, 
                modern facilities, and compassionate care. Book your appointment today.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/auth">
                  <Button className="rounded-xl h-12 px-8 text-sm font-bold gradient-btn text-white border-0 shadow-lg">
                    <CalendarCheck className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Button>
                </Link>
                <a href="#services">
                  <Button variant="outline" className="rounded-xl h-12 px-8 text-sm font-bold">
                    Our Services
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Hero visual */}
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 rounded-[3rem] bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <div className="w-64 h-64 rounded-[2.5rem] bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center">
                    <div className="w-48 h-48 rounded-[2rem] gradient-btn flex items-center justify-center shadow-2xl">
                      <Leaf className="h-20 w-20 text-white/90" />
                    </div>
                  </div>
                </div>
                {/* Floating cards */}
                <div className="absolute -top-4 -right-4 dashboard-card p-3 px-4 flex items-center gap-2 shadow-lg">
                  <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">15K+</p>
                    <p className="text-[10px] text-muted-foreground">Patients</p>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 dashboard-card p-3 px-4 flex items-center gap-2 shadow-lg">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Stethoscope className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">50+</p>
                    <p className="text-[10px] text-muted-foreground">Doctors</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 md:mt-20">
            {stats.map((stat) => (
              <div key={stat.label} className="dashboard-card p-5 text-center">
                <p className="text-2xl md:text-3xl font-extrabold text-foreground">{stat.value}</p>
                <p className="text-xs md:text-sm text-muted-foreground font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SERVICES ═══ */}
      <section id="services" className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <Badge className="rounded-full px-4 py-1.5 text-xs font-semibold bg-secondary/10 text-secondary border-secondary/20 mb-4">
              Our Services
            </Badge>
            <h2 className="text-2xl md:text-4xl font-extrabold text-foreground tracking-tight">
              Comprehensive Healthcare Services
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-2xl mx-auto">
              We provide a wide range of medical services to meet all your healthcare needs
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {services.map((service) => (
              <div key={service.title} className="dashboard-card p-6 md:p-8 group">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 mb-4 group-hover:bg-secondary/20 transition-colors">
                  <service.icon className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-foreground mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DOCTORS ═══ */}
      <section id="doctors" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <Badge className="rounded-full px-4 py-1.5 text-xs font-semibold bg-primary/10 text-primary border-primary/20 mb-4">
              Our Doctors
            </Badge>
            <h2 className="text-2xl md:text-4xl font-extrabold text-foreground tracking-tight">
              Meet Our Expert Doctors
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-2xl mx-auto">
              Experienced professionals dedicated to your well-being
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {doctors.map((doc) => (
              <div key={doc.name} className="dashboard-card p-6 text-center group">
                <div className="w-20 h-20 rounded-full gradient-btn mx-auto flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-xl font-bold text-white">{doc.img}</span>
                </div>
                <h3 className="text-base font-bold text-foreground">{doc.name}</h3>
                <p className="text-sm text-secondary font-medium mt-1">{doc.specialty}</p>
                <div className="flex items-center justify-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {doc.exp}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" /> {doc.rating}
                  </span>
                </div>
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="rounded-xl mt-4 text-xs font-semibold">
                    Book Appointment
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="dashboard-card p-8 md:p-12 lg:p-16 text-center bg-gradient-to-br from-primary to-secondary/80 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
                Ready to Book Your Appointment?
              </h2>
              <p className="text-sm md:text-base text-white/80 mt-3 max-w-xl mx-auto">
                Join thousands of satisfied patients. Register now and take control of your health journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <Link to="/auth">
                  <Button className="rounded-xl h-12 px-8 text-sm font-bold bg-white text-primary hover:bg-white/90 border-0">
                    <CalendarCheck className="h-4 w-4 mr-2" />
                    Book Now
                  </Button>
                </Link>
                <a href="tel:+880123456789">
                  <Button variant="outline" className="rounded-xl h-12 px-8 text-sm font-bold border-white/30 text-white hover:bg-white/10">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Us
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CONTACT ═══ */}
      <section id="contact" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="rounded-full px-4 py-1.5 text-xs font-semibold bg-secondary/10 text-secondary border-secondary/20 mb-4">
              Contact Us
            </Badge>
            <h2 className="text-2xl md:text-4xl font-extrabold text-foreground tracking-tight">
              Get In Touch
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="dashboard-card p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 mx-auto mb-4">
                <Phone className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Phone</h3>
              <p className="text-sm text-muted-foreground">+880 123-456-789</p>
              <p className="text-sm text-muted-foreground">+880 987-654-321</p>
            </div>
            <div className="dashboard-card p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Email</h3>
              <p className="text-sm text-muted-foreground">info@medicare-hospital.com</p>
              <p className="text-sm text-muted-foreground">support@medicare-hospital.com</p>
            </div>
            <div className="dashboard-card p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent mx-auto mb-4">
                <MapPin className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Address</h3>
              <p className="text-sm text-muted-foreground">123 Medical Center Road</p>
              <p className="text-sm text-muted-foreground">Dhaka, Bangladesh</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-primary text-white/80 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                  <Leaf className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-extrabold text-white">Medicare Cure Hub</span>
              </div>
              <p className="text-sm leading-relaxed text-white/60">
                Providing quality healthcare services with modern facilities and expert medical professionals.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3 text-sm">Quick Links</h4>
              <div className="space-y-2">
                {["Home", "Services", "Doctors", "Contact"].map((item) => (
                  <a key={item} href={`#${item.toLowerCase()}`} className="block text-sm text-white/60 hover:text-white transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3 text-sm">Services</h4>
              <div className="space-y-2">
                {["General Checkup", "Cardiology", "Laboratory", "Pharmacy", "Emergency"].map((s) => (
                  <p key={s} className="text-sm text-white/60">{s}</p>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3 text-sm">Working Hours</h4>
              <div className="space-y-2 text-sm text-white/60">
                <p>Mon - Fri: 8:00 AM - 10:00 PM</p>
                <p>Saturday: 9:00 AM - 8:00 PM</p>
                <p>Sunday: 10:00 AM - 6:00 PM</p>
                <p className="text-secondary font-medium">Emergency: 24/7</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-10 pt-6 text-center">
            <p className="text-xs text-white/40">© 2026 Medicare Cure Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
