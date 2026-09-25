import Experience from "@/components/home/Experience";
import Hero from "@/components/home/Hero";
import ProjectsSection from "@/components/home/ProjectsSection";
import About from "@/components/home/About";
import ContactSection from "@/components/home/ContactSection";

export default function Home() {
  return (
    <>
      <Hero />
      <ProjectsSection />
      <Experience />
      <About />
      <ContactSection />
    </>
  );
}
