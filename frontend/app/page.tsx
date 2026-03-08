import { HeroMap } from "./components/HeroMap";

export default function HomePage() {
  return (
    <main className="landingPage">
      <section className="mapPage" id="top">
        <HeroMap />
      </section>
    </main>
  );
}
