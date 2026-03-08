import Link from "next/link";

const highlights = [
  "Next.js App Router scaffold",
  "TypeScript-ready development setup",
  "A clean starting point for the GuidanceOS demo",
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">GuidanceOS</p>
        <h1>Hello world, this frontend is live.</h1>
        <p className="lede">
          A lightweight landing page to prove the app boots cleanly and give the team
          a solid place to start building the product experience.
        </p>

        <div className="actions">
          <Link className="primaryAction" href="https://www.ycombinator.com/rfs">
            View YC RFS
          </Link>
          <a className="secondaryAction" href="#highlights">
            See what&apos;s included
          </a>
        </div>
      </section>

      <section className="highlights" id="highlights" aria-label="Included in this starter">
        {highlights.map((item) => (
          <article className="highlightCard" key={item}>
            <span className="highlightDot" aria-hidden="true" />
            <p>{item}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
