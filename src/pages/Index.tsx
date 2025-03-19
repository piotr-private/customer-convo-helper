
import { useEffect } from "react";
import CustomerConvoHelper from "@/components/CustomerConvoHelper";

const Index = () => {
  // Add subtle animation effect when the page loads
  useEffect(() => {
    const mainContent = document.querySelector("main");
    if (mainContent) {
      mainContent.classList.add("opacity-0");
      setTimeout(() => {
        mainContent.classList.remove("opacity-0");
        mainContent.classList.add("transition-opacity", "duration-500", "opacity-100");
      }, 100);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <main className="min-h-screen flex flex-col items-center justify-center py-12">
        <CustomerConvoHelper />
      </main>
    </div>
  );
};

export default Index;
