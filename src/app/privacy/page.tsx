import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | DhabaRoute",
  description:
    "What DhabaRoute collects, what it doesn't, and who else can see information when you use the site.",
};

const LAST_UPDATED = "May 1, 2026";

export default function PrivacyPage() {
  return (
    <main
      className="mx-auto w-full px-5 sm:px-8 pt-10 pb-[72px] font-ui"
      style={{ maxWidth: 720, color: "var(--ink-soft)" }}
    >
      {/* Eyebrow + last-updated */}
      <p
        className="font-ui font-bold uppercase mb-3"
        style={{
          fontSize: "10.5px",
          letterSpacing: "0.18em",
          color: "var(--ink-muted)",
        }}
      >
        Privacy
      </p>

      <h1
        className="font-display font-extrabold text-ink leading-[1.1] mb-2"
        style={{ fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.02em" }}
      >
        Privacy Policy
      </h1>
      <p
        className="font-ui mb-10"
        style={{ fontSize: "13px", color: "var(--ink-muted)" }}
      >
        Last updated: {LAST_UPDATED}
      </p>

      {/* Intro */}
      <p
        className="font-ui leading-[1.78] mb-8"
        style={{ fontSize: "16.5px" }}
      >
        DhabaRoute (dhabaroute.com) is a free directory of authentic Indian
        dhabas along US highways. This page explains what we collect, what we
        don&rsquo;t, and who else can see information when you use the site.
      </p>

      <Section title="The short version">
        <ul className="list-disc pl-5 space-y-2.5" style={{ fontSize: "16.5px", lineHeight: 1.78 }}>
          <li>We don&rsquo;t ask you to sign up. There are no accounts, passwords, or profiles.</li>
          <li>
            The forms on the site (Submit a dhaba, Share info) are routed
            through Formspree to <Email />. Whatever you type goes to that
            inbox — that&rsquo;s it.
          </li>
          <li>
            &ldquo;Near me&rdquo; uses your browser&rsquo;s location only after
            you tap the button. The coordinates stay in your browser; we never
            receive them.
          </li>
          <li>
            We use Vercel Analytics for aggregate page-view counts. No
            cookies, no fingerprinting.
          </li>
          <li>
            Map tiles come from OpenStreetMap. Photos come from Google. When
            your browser loads them, those services see your IP — same as any
            image on the web.
          </li>
          <li>We may show ads from Google AdSense. AdSense uses cookies to personalize ads.</li>
        </ul>
      </Section>

      <Section title="Data we collect">
        <P>
          <strong>Directly from you:</strong> only the contents of forms you
          submit — your name, the dhaba info you&rsquo;re contributing,
          optional notes, and the email or phone you give us if you want a
          reply. These get emailed to <Email /> via Formspree. We don&rsquo;t
          store them anywhere else.
        </P>
        <P>
          <strong>Automatically:</strong> Vercel Analytics records aggregate
          page-view metrics (URL, country, referrer, device type). It does not
          set cookies, does not track you across sessions, and does not
          collect personal information.
        </P>
      </Section>

      <Section title="Third-party services your browser talks to">
        <div className="overflow-x-auto">
          <table
            className="w-full text-left"
            style={{
              fontSize: "14.5px",
              borderCollapse: "collapse",
              border: "1px solid var(--paper-warm)",
            }}
          >
            <thead>
              <tr style={{ background: "var(--paper-soft)" }}>
                <Th>Service</Th>
                <Th>What for</Th>
                <Th>What they see</Th>
              </tr>
            </thead>
            <tbody>
              <Tr>
                <Td>
                  <Ext href="https://wiki.osmfoundation.org/wiki/Privacy_Policy">
                    OpenStreetMap
                  </Ext>
                </Td>
                <Td>Map tiles</Td>
                <Td>Your IP and the tiles you fetch</Td>
              </Tr>
              <Tr>
                <Td>
                  <Ext href="https://policies.google.com/privacy">
                    Google (lh3.googleusercontent.com)
                  </Ext>
                </Td>
                <Td>Dhaba photos</Td>
                <Td>Your IP when an image loads</Td>
              </Tr>
              <Tr>
                <Td>
                  <Ext href="https://formspree.io/legal/privacy-policy/">
                    Formspree
                  </Ext>
                </Td>
                <Td>Form submissions</Td>
                <Td>The fields you submit</Td>
              </Tr>
              <Tr>
                <Td>
                  <Ext href="https://vercel.com/legal/privacy-policy">
                    Vercel Analytics
                  </Ext>
                </Td>
                <Td>Aggregate page views</Td>
                <Td>Nothing personal</Td>
              </Tr>
              <Tr>
                <Td>
                  <Ext href="https://policies.google.com/technologies/partner-sites">
                    Google AdSense
                  </Ext>
                </Td>
                <Td>Advertising (when enabled)</Td>
                <Td>See cookies section below</Td>
              </Tr>
            </tbody>
          </table>
        </div>
        <p
          className="font-ui mt-3"
          style={{ fontSize: "13.5px", color: "var(--ink-muted)" }}
        >
          Each provider name links to its own privacy policy.
        </p>
      </Section>

      <Section title="Cookies and Google AdSense">
        <P>
          When AdSense is enabled, Google and its partners may set cookies on
          your browser to show relevant ads, measure ad performance, and
          prevent fraudulent clicks.
        </P>
        <P>You can control this in two places:</P>
        <ul className="list-disc pl-5 space-y-2.5" style={{ fontSize: "16.5px", lineHeight: 1.78 }}>
          <li>
            <strong>Google&rsquo;s Ads Settings</strong> — opt out of
            personalized ads at{" "}
            <Ext href="https://adssettings.google.com">adssettings.google.com</Ext>.
          </li>
          <li>
            <strong>Industry opt-outs</strong> —{" "}
            <Ext href="https://www.aboutads.info/choices/">aboutads.info/choices</Ext>
            {" "}and{" "}
            <Ext href="https://optout.networkadvertising.org/">
              optout.networkadvertising.org
            </Ext>.
          </li>
        </ul>
        <P>
          If you have a &ldquo;Do Not Track&rdquo; signal enabled in your
          browser, we honor it for our own analytics, but we can&rsquo;t
          enforce it for third-party ads — for those, use the opt-outs above.
        </P>
      </Section>

      <Section title="Your location">
        <P>
          If you tap &ldquo;Near me,&rdquo; the browser asks your permission to
          share your location. If you allow it, your coordinates are saved in
          your browser&rsquo;s <code style={inlineCode}>sessionStorage</code>
          {" "}(cleared when you close the tab). They never leave your device.
          We use them locally to sort dhabas by distance.
        </P>
      </Section>

      <Section title="Children's privacy">
        <P>
          This site is not directed to children under 13. We do not knowingly
          collect data from children under 13. If you believe a child has
          submitted information, contact us and we&rsquo;ll remove it.
        </P>
      </Section>

      <Section title="Your choices">
        <ul className="list-disc pl-5 space-y-2.5" style={{ fontSize: "16.5px", lineHeight: 1.78 }}>
          <li>Don&rsquo;t submit forms if you don&rsquo;t want your input emailed to us.</li>
          <li>Block AdSense with browser settings or an ad blocker.</li>
          <li>Don&rsquo;t tap &ldquo;Near me&rdquo; to skip geolocation.</li>
          <li>
            Disable Vercel Analytics by enabling &ldquo;Do Not Track&rdquo; in
            your browser, or with most ad blockers.
          </li>
        </ul>
        <P>
          US residents have additional rights under state laws (e.g. California
          CCPA, Virginia VCDPA). To exercise any of these, email <Email />.
        </P>
      </Section>

      <Section title="Changes to this policy">
        <P>
          If we change what this site does with data, we&rsquo;ll update this
          page and the &ldquo;Last updated&rdquo; date at the top. Substantial
          changes — like adding a new third-party service that collects user
          data — will be called out at the top of the page for at least 30
          days.
        </P>
      </Section>

      <Section title="Contact">
        <P>
          For privacy questions or requests, email{" "}
          <a
            href="mailto:dhabaroute@gmail.com"
            className="font-semibold"
            style={{ color: "var(--accent)" }}
          >
            dhabaroute@gmail.com
          </a>
          .
        </P>
      </Section>

      {/* Quiet "back to home" */}
      <div className="mt-12">
        <Link
          href="/"
          className="dr-footer-link inline-flex items-center gap-1"
          style={{ fontSize: "13px" }}
        >
          ← Back to DhabaRoute
        </Link>
      </div>
    </main>
  );
}

// ── Tiny presentational helpers ─────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2
        className="font-display font-bold text-ink mb-3"
        style={{ fontSize: "20px", letterSpacing: "-0.01em" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-ui leading-[1.78] mb-4"
      style={{ fontSize: "16.5px" }}
    >
      {children}
    </p>
  );
}

function Email() {
  return (
    <a
      href="mailto:dhabaroute@gmail.com"
      className="font-semibold"
      style={{ color: "var(--accent)" }}
    >
      dhabaroute@gmail.com
    </a>
  );
}

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="dr-footer-link underline decoration-paper-warm decoration-from-font underline-offset-2"
    >
      {children}
    </a>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="font-ui font-semibold text-ink"
      style={{
        fontSize: "13px",
        padding: "10px 14px",
        borderBottom: "1px solid var(--paper-warm)",
        textAlign: "left",
      }}
    >
      {children}
    </th>
  );
}

function Tr({ children }: { children: React.ReactNode }) {
  return (
    <tr style={{ borderBottom: "1px solid var(--paper-warm)" }}>{children}</tr>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td
      className="font-ui align-top"
      style={{ padding: "10px 14px", color: "var(--ink-soft)" }}
    >
      {children}
    </td>
  );
}

const inlineCode: React.CSSProperties = {
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: "0.92em",
  background: "var(--paper-soft)",
  padding: "1px 6px",
  borderRadius: 4,
  border: "1px solid var(--paper-warm)",
};
