import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Featured from "@/components/Featured";
import Promo from "@/components/Promo";
import Footer from "@/components/Footer";
import AssistantChat from "@/components/AssistantChat";

const Index = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Featured refreshKey={refreshKey} />
      <Promo />
      <Footer />
      <AssistantChat onAction={() => setRefreshKey((k) => k + 1)} />
    </main>
  );
};

export default Index;
