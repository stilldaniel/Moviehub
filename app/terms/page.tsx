import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { LegalSection } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms for using ${SITE_NAME}.`,
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={
        <p>
          These terms apply to your use of {SITE_NAME} ({SITE_URL}). By using the site or creating an account,
          you agree to them. If you don&apos;t agree, please don&apos;t use {SITE_NAME}.
        </p>
      }
    >
      <LegalSection id="service" title="What Zora Stream is">
        <p>{SITE_NAME} helps you discover movies, TV shows and anime, see where they&apos;re available to watch, watch trailers and public-domain films, and follow sports scores and official free streams. It&apos;s provided free of charge.</p>
        <p>{SITE_NAME} does not host or sell commercial films or shows. Links to streaming services take you to those services, which have their own terms and prices.</p>
      </LegalSection>

      <LegalSection id="accounts" title="Your account">
        <ul>
          <li>You must be at least 13 years old to create an account.</li>
          <li>Give accurate information and keep your sign-in details secure. You&apos;re responsible for activity on your account.</li>
          <li>You can delete your account at any time from Profile → Settings.</li>
        </ul>
      </LegalSection>

      <LegalSection id="acceptable-use" title="Acceptable use">
        <p>When using {SITE_NAME}, you agree not to:</p>
        <ul>
          <li>Post reviews or profile content that is unlawful, hateful, harassing, sexually explicit, or that infringes someone else&apos;s rights.</li>
          <li>Try to access other people&apos;s accounts or data, or interfere with the site&apos;s security or operation.</li>
          <li>Scrape the site or its data, send automated traffic, or use it to build a competing service.</li>
          <li>Use the site for anything illegal.</li>
        </ul>
        <p>We may remove content or suspend accounts that break these rules.</p>
      </LegalSection>

      <LegalSection id="your-content" title="Your content">
        <p>You keep ownership of the ratings and reviews you write. By posting them, you allow {SITE_NAME} to store and display them as part of the service. You can delete them, or your whole account, at any time.</p>
      </LegalSection>

      <LegalSection id="third-party-content" title="Third-party content and services">
        <ul>
          <li>Movie and TV information and images come from <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">The Movie Database (TMDB)</a>. This product uses the TMDB API but is not endorsed or certified by TMDB.</li>
          <li>Streaming availability is provided by <a href="https://www.justwatch.com" target="_blank" rel="noopener noreferrer">JustWatch</a> through TMDB.</li>
          <li>Free films are public-domain works streamed from the <a href="https://archive.org" target="_blank" rel="noopener noreferrer">Internet Archive</a>.</li>
          <li>Trailers and live sports streams are played from YouTube, only from official channels. Sports scores, fixtures and tables come from ESPN.</li>
        </ul>
        <p>This information is provided as-is by those sources. We can&apos;t guarantee it&apos;s always complete, accurate or up to date. For example, scores may be delayed and streaming availability can change. Your use of third-party services is governed by their own terms.</p>
      </LegalSection>

      <LegalSection id="ip" title="Zora Stream's content">
        <p>The {SITE_NAME} name, logo and site design belong to {SITE_NAME}. Please don&apos;t use them in a way that suggests we endorse you or your product.</p>
      </LegalSection>

      <LegalSection id="disclaimer" title="Disclaimer">
        <p>{SITE_NAME} is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of any kind. We don&apos;t promise that it will always be available, uninterrupted or error-free.</p>
      </LegalSection>

      <LegalSection id="liability" title="Limitation of liability">
        <p>To the fullest extent permitted by law, {SITE_NAME} is not liable for any indirect, incidental or consequential loss arising from your use of the site, including reliance on scores, schedules or availability information shown on it.</p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to the service and these terms">
        <p>We may change, pause or discontinue features at any time. If we update these terms, we&apos;ll change the date at the top of this page; continuing to use {SITE_NAME} after that means you accept the updated terms.</p>
      </LegalSection>

      <LegalSection id="privacy" title="Privacy">
        <p>Our <Link href="/privacy">Privacy Policy</Link> explains how we handle your information.</p>
      </LegalSection>

      <LegalSection id="contact" title="Contact">
        <p>Questions about these terms? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}
