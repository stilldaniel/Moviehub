import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { LegalSection } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} collects, uses and protects your information.`,
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          This policy explains what information {SITE_NAME} ({SITE_URL}) collects when you use it, how that
          information is used, and the choices you have. {SITE_NAME} is a personal project for discovering
          movies, TV shows, anime and sports. We collect only what the features you use need, we don&apos;t
          show ads, and we don&apos;t sell your information.
        </p>
      }
    >
      <LegalSection id="collect" title="Information we collect">
        <p><strong>Account information.</strong> When you create an account we store your email address and, if you provide them, your name, username and profile picture. If you sign in with Google, we receive your name, email address and profile picture from Google. We never receive your Google password. If you sign up with email, your password is handled by our authentication provider and stored only in hashed form.</p>
        <p><strong>Activity you choose to save.</strong> Titles you add to your favorites, titles you watch trailers or free films for (your watch history), and ratings and reviews you write.</p>
        <p><strong>Account usage.</strong> The date you last signed in, used to show your daily streak on your profile.</p>
        <p><strong>Stored only on your device.</strong> Your recent searches (used to personalise recommendations) and your chosen country for &ldquo;Where to Watch&rdquo; are saved in your browser&apos;s local storage and are not sent to us.</p>
        <p><strong>Technical information.</strong> Like most websites, our hosting provider automatically records basic request information such as IP address, browser type and the pages requested, for security and to keep the service running.</p>
      </LegalSection>

      <LegalSection id="use" title="How we use your information">
        <ul>
          <li>To create and secure your account and keep you signed in.</li>
          <li>To show your favorites, watch history, ratings and profile across your devices.</li>
          <li>To recommend titles based on what you&apos;ve saved, watched and searched for.</li>
          <li>To keep the service working, prevent abuse and fix problems.</li>
        </ul>
        <p>We don&apos;t use your information for advertising, we don&apos;t use analytics or tracking tools, and we don&apos;t sell or rent your information to anyone.</p>
      </LegalSection>

      <LegalSection id="third-parties" title="Services we rely on">
        <p>{SITE_NAME} uses the following providers. Each processes information only as needed to provide its part of the service, under its own privacy policy:</p>
        <ul>
          <li><strong>Supabase</strong> stores your account, profile, favorites, watch history, ratings and profile picture.</li>
          <li><strong>Vercel</strong> hosts the website.</li>
          <li><strong>Google</strong> handles &ldquo;Continue with Google&rdquo; sign-in, if you choose to use it.</li>
          <li><strong>The Movie Database (TMDB)</strong> provides movie and TV information and images. Posters and backdrops load directly from TMDB&apos;s servers, so TMDB can see your IP address.</li>
          <li><strong>YouTube</strong> plays trailers and official sports streams, and the <strong>Internet Archive</strong> plays public-domain films. When you play one of these, it loads from that service, which may set its own cookies.</li>
          <li><strong>API-Sports</strong> and <strong>JustWatch</strong> (through TMDB) provide sports scores and streaming availability. These requests are made by our server and don&apos;t include your personal information.</li>
        </ul>
      </LegalSection>

      <LegalSection id="cookies" title="Cookies and local storage">
        <p>We use cookies only to keep you signed in. We don&apos;t use advertising or analytics cookies. Embedded players from YouTube and the Internet Archive may set their own cookies when you use them.</p>
      </LegalSection>

      <LegalSection id="retention" title="How long we keep information">
        <p>We keep your account information and saved activity for as long as your account exists. You can remove individual items (such as a favorite or a history entry) at any time. When you delete your account, your profile, favorites, watch history, ratings and profile picture are permanently deleted.</p>
      </LegalSection>

      <LegalSection id="choices" title="Your choices and rights">
        <ul>
          <li><strong>See and edit</strong> your information on your <Link href="/profile">profile</Link>.</li>
          <li><strong>Delete your account</strong> and all its data from Profile → Settings → Delete account.</li>
          <li><strong>Clear your search history</strong> by clearing this site&apos;s data in your browser.</li>
          <li><strong>Ask us</strong> for a copy of your information, or to correct or delete it, by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</li>
        </ul>
      </LegalSection>

      <LegalSection id="security" title="Security">
        <p>Your data is stored with access controls so that each account can only read and change its own information, and all traffic to the site is encrypted with HTTPS. No online service can be perfectly secure, but we take reasonable steps to protect your information.</p>
      </LegalSection>

      <LegalSection id="children" title="Children">
        <p>{SITE_NAME} is not intended for children under 13, and we don&apos;t knowingly collect information from them. If you believe a child has created an account, contact us and we&apos;ll delete it.</p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to this policy">
        <p>If we change this policy, we&apos;ll update the date at the top of this page. Significant changes will also be announced on the site.</p>
      </LegalSection>

      <LegalSection id="contact" title="Contact">
        <p>Questions about this policy or your information? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}
