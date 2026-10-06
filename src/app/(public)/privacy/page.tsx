import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · Lirium Nutrition",
};

const CONTACT = "rodolfo.agosto@gmail.com";

export default function PrivacyPage() {
  return (
    <article className="flex w-full max-w-2xl flex-col gap-6 text-[15px] leading-relaxed text-foreground">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <p className="text-sm text-muted">Last updated: October 6, 2026</p>
      </header>

      <p>
        Lirium Nutrition is a personal portfolio project that demonstrates a nutrition planning web
        application. It is not a commercial service. This page explains what data the demo handles.
      </p>

      <Section title="What we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>If you sign up with email:</strong> your first name, last name and email address,
            and your password, which is stored only as a hash.
          </li>
          <li>
            <strong>If you sign in with Google:</strong> your name and email address, as provided by
            Google. We request only the basic <em>email</em> and <em>profile</em> permissions.
          </li>
        </ul>
      </Section>

      <Section title="How we use it">
        <p>
          Only to create your account and let you sign in. We do not sell, share or use your data for
          advertising or analytics.
        </p>
      </Section>

      <Section title="Storage and cookies">
        <p>
          Account data is stored in a managed PostgreSQL database. Session tokens are kept in your
          browser&apos;s local storage until you log out or they expire. Logging out invalidates your
          token on the server. This site does not use tracking cookies.
        </p>
      </Section>

      <Section title="Deleting your data">
        <p>
          Since this is a demo, you can ask for your account and data to be deleted at any time by
          writing to{" "}
          <a className="font-medium text-primary hover:underline" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>
          .
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about this policy:{" "}
          <a className="font-medium text-primary hover:underline" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>
          .
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
